"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { getValidToken } from "@/lib/auth-helpers";
import type { UserProgress, Milestone, MilestoneType, ProgressStage } from "@/db/types";
import { notifyMilestoneUnlocked } from "@/actions/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SuccessDashboardData {
  userName: string;
  company: string;
  progressRecords: UserProgress[];
  milestones: Milestone[];
  sessionsCompleted: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getToken = getValidToken;

// ---------------------------------------------------------------------------
// Get success dashboard data
// ---------------------------------------------------------------------------

export async function getSuccessDashboardData(): Promise<{
  success: boolean;
  error?: string;
  data?: SuccessDashboardData;
}> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, error: "Failed to get user info" };
  }

  // Fetch user profile
  const { data: users, error: userError } = await insforgeClient
    .from("users")
    .select<Array<{ full_name: string; company_name: string }>>(
      token,
      `?id=eq.${authUser.id}&select=full_name,company_name`
    );

  if (userError || !users || users.length === 0) {
    return { success: false, error: "User profile not found" };
  }

  // Fetch progress records
  const { data: progress } = await insforgeClient
    .from("user_progress")
    .select<UserProgress[]>(
      token,
      `?user_id=eq.${authUser.id}&order=created_at.asc`
    );

  // Fetch milestones
  const { data: milestones } = await insforgeClient
    .from("milestones")
    .select<Milestone[]>(
      token,
      `?user_id=eq.${authUser.id}`
    );

  // Fetch completed WAR battle sessions count
  const { data: doneSessions } = await insforgeClient
    .from("war_battle_sessions")
    .select<Array<{ id: string }>>(
      token,
      `?user_id=eq.${authUser.id}&status=eq.done&select=id`
    );

  return {
    success: true,
    data: {
      userName: users[0].full_name,
      company: users[0].company_name,
      progressRecords: progress ?? [],
      milestones: milestones ?? [],
      sessionsCompleted: doneSessions?.length ?? 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Check and unlock milestones
// ---------------------------------------------------------------------------

/**
 * Checks if either milestone should be unlocked based on progress, and
 * creates/updates the milestone record if so. Sends notification to Dana.
 *
 * Milestone 1 (waste_eliminator): Complete all 4 modules + battle 1
 * Milestone 2 (ci_consultant): Complete battle 2 + battle 3
 */
export async function checkAndUnlockMilestones(): Promise<{
  success: boolean;
  unlocked: MilestoneType[];
}> {
  const token = await getToken();
  if (!token) {
    return { success: false, unlocked: [] };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, unlocked: [] };
  }

  // Fetch user profile
  const { data: users } = await insforgeClient
    .from("users")
    .select<Array<{ full_name: string; company_name: string }>>(
      token,
      `?id=eq.${authUser.id}&select=full_name,company_name`
    );

  // Fetch progress
  const { data: progress } = await insforgeClient
    .from("user_progress")
    .select<UserProgress[]>(
      token,
      `?user_id=eq.${authUser.id}&status=eq.completed`
    );

  // Fetch existing milestones
  const { data: existingMilestones } = await insforgeClient
    .from("milestones")
    .select<Milestone[]>(
      token,
      `?user_id=eq.${authUser.id}`
    );

  const completedStages = new Set(
    (progress ?? []).map((p) => p.stage)
  );
  const existing = existingMilestones ?? [];
  const userName = users?.[0]?.full_name ?? "Unknown";
  const company = users?.[0]?.company_name ?? "";
  const unlocked: MilestoneType[] = [];

  // Check waste_eliminator: all 4 modules + battle 1
  const wasteEliminatorReqs: ProgressStage[] = ["module_1", "module_2", "module_3", "module_4", "battle_1"];
  const wasteEliminatorMet = wasteEliminatorReqs.every((s) => completedStages.has(s));
  const wasteEliminatorExisting = existing.find((m) => m.milestone_type === "waste_eliminator");

  if (wasteEliminatorMet && (!wasteEliminatorExisting || !wasteEliminatorExisting.unlocked)) {
    if (wasteEliminatorExisting) {
      await insforgeClient
        .from("milestones")
        .update(
          { unlocked: true, unlocked_at: new Date().toISOString() },
          token,
          `?id=eq.${wasteEliminatorExisting.id}`
        );
    } else {
      await insforgeClient.from("milestones").insert(
        {
          user_id: authUser.id,
          milestone_type: "waste_eliminator",
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        },
        token
      );
    }
    unlocked.push("waste_eliminator");
    notifyMilestoneUnlocked({ userName, company, milestoneType: "waste_eliminator" }).catch(
      (err) => console.error("Failed to send milestone notification:", err)
    );
  }

  // Check ci_consultant: battle 2 + battle 3
  const ciConsultantReqs: ProgressStage[] = ["battle_2", "battle_3"];
  const ciConsultantMet = ciConsultantReqs.every((s) => completedStages.has(s));
  const ciConsultantExisting = existing.find((m) => m.milestone_type === "ci_consultant");

  if (ciConsultantMet && (!ciConsultantExisting || !ciConsultantExisting.unlocked)) {
    if (ciConsultantExisting) {
      await insforgeClient
        .from("milestones")
        .update(
          { unlocked: true, unlocked_at: new Date().toISOString() },
          token,
          `?id=eq.${ciConsultantExisting.id}`
        );
    } else {
      await insforgeClient.from("milestones").insert(
        {
          user_id: authUser.id,
          milestone_type: "ci_consultant",
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        },
        token
      );
    }
    unlocked.push("ci_consultant");
    notifyMilestoneUnlocked({ userName, company, milestoneType: "ci_consultant" }).catch(
      (err) => console.error("Failed to send milestone notification:", err)
    );
  }

  return { success: true, unlocked };
}
