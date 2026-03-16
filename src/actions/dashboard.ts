"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { getValidToken } from "@/lib/auth-helpers";
import type { UserProgress, Milestone } from "@/db/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardData {
  userName: string;
  onboardingCompleted: boolean;
  progressRecords: UserProgress[];
  sessionsCompleted: number;
  activeProjects: number;
  milestones: Milestone[];
}

// ---------------------------------------------------------------------------
// Get current user token
// ---------------------------------------------------------------------------

const getToken = getValidToken;

// ---------------------------------------------------------------------------
// Get user name for layout sidebar
// ---------------------------------------------------------------------------

export async function getUserName(): Promise<string> {
  const token = await getToken();
  if (!token) return "";

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) return "";

  // Try app users table first
  const { data: users } = await insforgeClient
    .from("users")
    .select<Array<{ full_name: string }>>(
      token,
      `?id=eq.${authUser.id}&select=full_name`
    );

  if (users?.[0]?.full_name) return users[0].full_name;

  // Fall back to Insforge auth profile
  const { data: profile } = await insforgeAuth.getProfile(authUser.id);
  return profile?.name ?? "";
}

// ---------------------------------------------------------------------------
// Get dashboard data (user info + progress records)
// ---------------------------------------------------------------------------

export async function getDashboardData(): Promise<{
  success: boolean;
  error?: string;
  data?: DashboardData;
}> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, error: "Failed to get user info" };
  }

  // Fetch user name and onboarding status
  const { data: users, error: userError } = await insforgeClient
    .from("users")
    .select<Array<{ full_name: string; onboarding_completed: boolean }>>(
      token,
      `?id=eq.${authUser.id}&select=full_name,onboarding_completed`
    );

  if (userError || !users || users.length === 0) {
    return { success: false, error: "User profile not found" };
  }

  // Fetch all progress records
  const { data: progress, error: progressError } = await insforgeClient
    .from("user_progress")
    .select<UserProgress[]>(
      token,
      `?user_id=eq.${authUser.id}&order=created_at.asc`
    );

  if (progressError) {
    console.error("Failed to fetch progress:", progressError);
  }

  // Fetch completed WAR battle sessions count
  const { data: sessions } = await insforgeClient
    .from("war_battle_sessions")
    .select<Array<{ id: string }>>(
      token,
      `?user_id=eq.${authUser.id}&status=eq.done&select=id`
    );

  // Fetch active improvement opportunities count
  const { data: opportunities } = await insforgeClient
    .from("improvement_opportunities")
    .select<Array<{ id: string }>>(
      token,
      `?user_id=eq.${authUser.id}&status=eq.active&select=id`
    );

  // Fetch milestones
  const { data: milestones } = await insforgeClient
    .from("milestones")
    .select<Milestone[]>(
      token,
      `?user_id=eq.${authUser.id}`
    );

  return {
    success: true,
    data: {
      userName: users[0].full_name,
      onboardingCompleted: users[0].onboarding_completed,
      progressRecords: progress ?? [],
      sessionsCompleted: sessions?.length ?? 0,
      activeProjects: opportunities?.length ?? 0,
      milestones: milestones ?? [],
    },
  };
}
