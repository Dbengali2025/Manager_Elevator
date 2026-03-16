"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { getValidToken } from "@/lib/auth-helpers";
import type { ActionResult } from "./auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OnboardingState {
  currentStep: number;
  assessmentAnswers: Record<string, string> | null;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Get current user token
// ---------------------------------------------------------------------------

const getToken = getValidToken;

// ---------------------------------------------------------------------------
// Get user info (name + onboarding state)
// ---------------------------------------------------------------------------

export async function getOnboardingUserInfo(): Promise<{
  success: boolean;
  error?: string;
  userName?: string;
  onboardingCompleted?: boolean;
  ciExperienceLevel?: string | null;
  onboardingStep?: number;
}> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, error: "Failed to get user info" };
  }

  // Fetch user record from users table
  const { data: users, error: fetchError } = await insforgeClient
    .from("users")
    .select<Array<{ full_name: string; onboarding_completed: boolean; ci_experience_level: string | null; onboarding_step: number | null }>>(
      token,
      `?id=eq.${authUser.id}`
    );

  if (fetchError || !users || users.length === 0) {
    return { success: false, error: "User profile not found" };
  }

  const user = users[0];
  return {
    success: true,
    userName: user.full_name,
    onboardingCompleted: user.onboarding_completed,
    ciExperienceLevel: user.ci_experience_level,
    onboardingStep: user.onboarding_step ?? 1,
  };
}

// ---------------------------------------------------------------------------
// Save onboarding step progress
// ---------------------------------------------------------------------------

export async function saveOnboardingStep(step: number): Promise<ActionResult> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, error: "Failed to get user info" };
  }

  const { error } = await insforgeClient
    .from("users")
    .update(
      { onboarding_step: step },
      token,
      `?id=eq.${authUser.id}`
    );

  if (error) {
    console.error("Failed to save onboarding step:", error);
    return { success: false, error: "Failed to save progress" };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Save CI assessment answers
// ---------------------------------------------------------------------------

export async function saveAssessmentAnswers(
  answers: Record<string, string>
): Promise<ActionResult> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, error: "Failed to get user info" };
  }

  // Derive experience level from answers
  const experienceLevel = deriveExperienceLevel(answers);

  const { error } = await insforgeClient
    .from("users")
    .update(
      {
        ci_experience_level: experienceLevel,
        onboarding_step: 3, // Move to next step
      },
      token,
      `?id=eq.${authUser.id}`
    );

  if (error) {
    console.error("Failed to save assessment:", error);
    return { success: false, error: "Failed to save assessment" };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Complete onboarding
// ---------------------------------------------------------------------------

export async function completeOnboarding(): Promise<ActionResult> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, error: "Failed to get user info" };
  }

  // Mark onboarding as completed
  const { error: updateError } = await insforgeClient
    .from("users")
    .update(
      {
        onboarding_completed: true,
        onboarding_step: 6, // Past last step
      },
      token,
      `?id=eq.${authUser.id}`
    );

  if (updateError) {
    console.error("Failed to complete onboarding:", updateError);
    return { success: false, error: "Failed to complete onboarding" };
  }

  // Create onboarding progress record
  const { error: progressError } = await insforgeClient
    .from("user_progress")
    .insert(
      {
        user_id: authUser.id,
        stage: "onboarding",
        status: "completed",
        completed_at: new Date().toISOString(),
      },
      token
    );

  if (progressError) {
    console.error("Failed to create progress record:", progressError);
    // Don't fail — onboarding is already marked completed
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveExperienceLevel(answers: Record<string, string>): string {
  // Score: beginner (0-1 "experienced" answers), intermediate (2), advanced (3)
  let score = 0;

  if (answers.q1 === "very_familiar" || answers.q1 === "certified") score++;
  if (answers.q2 === "led_multiple" || answers.q2 === "led_one") score++;
  if (answers.q3 === "formal_tools" || answers.q3 === "dashboards") score++;

  if (score >= 3) return "advanced";
  if (score >= 1) return "intermediate";
  return "beginner";
}
