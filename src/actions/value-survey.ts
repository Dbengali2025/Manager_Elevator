"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { getValidToken } from "@/lib/auth-helpers";
import {
  scoreSurvey,
  isSurveyComplete,
  getDueOccasion,
  getNextOccasion,
  BASELINE_OCCASION,
  SURVEY_OCCASIONS,
} from "@/lib/value-survey";
import type { ActionResult } from "./auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SurveyRow {
  id: string;
  user_id: string;
  occasion: string;
  answers: Record<string, number>;
  section_scores: Record<string, number>;
  total_score: number;
  percentage: number;
  tier: string;
  completed_at: string;
}

export interface SurveyEntry {
  occasion: string;
  totalScore: number;
  percentage: number;
  tier: string;
  sectionScores: Record<string, number>;
  completedAt: string;
}

export interface ValueSurveyStatus {
  success: boolean;
  error?: string;
  /** Every survey this user has completed, oldest first. */
  history: SurveyEntry[];
  /** True once the onboarding baseline has been taken. */
  hasBaseline: boolean;
  /** A retake that is due right now, if any. */
  dueOccasion: { key: string; label: string } | null;
  /** The next retake on the calendar, due or not. */
  nextOccasion: { key: string; label: string; dueDate: string } | null;
}

// ---------------------------------------------------------------------------
// Submit a survey response
// ---------------------------------------------------------------------------

export async function submitValueSurvey(
  occasion: string,
  answers: Record<string, number>
): Promise<ActionResult & { totalScore?: number; percentage?: number; tier?: string }> {
  const token = await getValidToken();
  if (!token) return { success: false, error: "Not authenticated" };

  if (!SURVEY_OCCASIONS.some((o) => o.key === occasion)) {
    return { success: false, error: "Unknown survey occasion" };
  }

  if (!isSurveyComplete(answers)) {
    return { success: false, error: "Please answer every statement before submitting." };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) return { success: false, error: "Failed to get user info" };

  const result = scoreSurvey(answers);

  const payload = {
    answers,
    section_scores: result.sectionScores,
    total_score: result.totalScore,
    percentage: result.percentage,
    tier: result.tier.label,
    completed_at: new Date().toISOString(),
  };

  // One row per (user, occasion) — update in place if it already exists so a
  // resumed or re-submitted survey does not violate the unique index.
  const { data: existing } = await insforgeClient
    .from("manager_value_surveys")
    .select<Array<{ id: string }>>(
      token,
      `?user_id=eq.${authUser.id}&occasion=eq.${occasion}&select=id`
    );

  if (existing && existing.length > 0) {
    const { error } = await insforgeClient
      .from("manager_value_surveys")
      .update(payload, token, `?id=eq.${existing[0].id}`);

    if (error) {
      console.error("Failed to update value survey:", error);
      return { success: false, error: "Failed to save your survey. Please try again." };
    }
  } else {
    const { error } = await insforgeClient
      .from("manager_value_surveys")
      .insert({ user_id: authUser.id, occasion, ...payload }, token);

    if (error) {
      console.error("Failed to insert value survey:", error);
      return { success: false, error: "Failed to save your survey. Please try again." };
    }
  }

  return {
    success: true,
    totalScore: result.totalScore,
    percentage: result.percentage,
    tier: result.tier.label,
  };
}

// ---------------------------------------------------------------------------
// Read this user's survey history and what is due
// ---------------------------------------------------------------------------

export async function getValueSurveyStatus(): Promise<ValueSurveyStatus> {
  const empty: ValueSurveyStatus = {
    success: false,
    history: [],
    hasBaseline: false,
    dueOccasion: null,
    nextOccasion: null,
  };

  const token = await getValidToken();
  if (!token) return { ...empty, error: "Not authenticated" };

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) return { ...empty, error: "Failed to get user info" };

  const { data: rows, error } = await insforgeClient
    .from("manager_value_surveys")
    .select<SurveyRow[]>(token, `?user_id=eq.${authUser.id}&order=completed_at.asc`);

  if (error) {
    console.error("Failed to load value surveys:", error);
    return { ...empty, error: "Failed to load survey history" };
  }

  const history: SurveyEntry[] = (rows ?? []).map((r) => ({
    occasion: r.occasion,
    totalScore: r.total_score,
    percentage: Number(r.percentage),
    tier: r.tier,
    sectionScores: r.section_scores ?? {},
    completedAt: r.completed_at,
  }));

  const baseline = history.find((h) => h.occasion === BASELINE_OCCASION);
  const baselineDate = baseline ? new Date(baseline.completedAt) : null;
  const completed = history.map((h) => h.occasion);

  const due = getDueOccasion(baselineDate, completed);
  const next = getNextOccasion(baselineDate, completed);

  return {
    success: true,
    history,
    hasBaseline: !!baseline,
    dueOccasion: due ? { key: due.key, label: due.label } : null,
    nextOccasion: next
      ? {
          key: next.occasion.key,
          label: next.occasion.label,
          dueDate: next.dueDate.toISOString(),
        }
      : null,
  };
}
