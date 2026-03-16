"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { getValidToken } from "@/lib/auth-helpers";
import type { User, UserProgress, Milestone, WarBattleSession } from "@/db/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  industry: string;
  role_title: string;
  current_stage: string;
  sessions_completed: number;
  last_active: string;
  milestones: Milestone[];
  progress_records: UserProgress[];
  war_sessions: WarBattleSession[];
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeUsersLast7Days: number;
  averageOnboardingRate: number;
}

export interface AdminDashboardData {
  stats: AdminOverviewStats;
  users: AdminUser[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getToken = getValidToken;

async function verifyAdmin(token: string): Promise<{ userId: string; isAdmin: boolean }> {
  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { userId: "", isAdmin: false };
  }

  // Check role in users table
  const { data: users } = await insforgeClient
    .from("users")
    .select<Array<{ role: string }>>(token, `?id=eq.${authUser.id}&select=role`);

  const isAdmin = users && users.length > 0 && users[0].role === "admin";
  return { userId: authUser.id, isAdmin: !!isAdmin };
}

// ---------------------------------------------------------------------------
// Get admin dashboard data
// ---------------------------------------------------------------------------

export async function getAdminDashboardData(): Promise<{
  success: boolean;
  error?: string;
  data?: AdminDashboardData;
}> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { isAdmin } = await verifyAdmin(token);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: admin access required" };
  }

  // Fetch all users
  const { data: allUsers, error: usersError } = await insforgeClient
    .from("users")
    .select<User[]>(token, "?role=eq.user&order=created_at.desc");

  if (usersError || !allUsers) {
    return { success: false, error: "Failed to fetch users" };
  }

  // Fetch all progress records (admin RLS allows reading all)
  const { data: allProgress } = await insforgeClient
    .from("user_progress")
    .select<UserProgress[]>(token, "?order=created_at.asc");

  // Fetch all milestones
  const { data: allMilestones } = await insforgeClient
    .from("milestones")
    .select<Milestone[]>(token);

  // Fetch all WAR battle sessions
  const { data: allSessions } = await insforgeClient
    .from("war_battle_sessions")
    .select<WarBattleSession[]>(token);

  // Group data by user
  const progressByUser = groupBy(allProgress ?? [], "user_id");
  const milestonesByUser = groupBy(allMilestones ?? [], "user_id");
  const sessionsByUser = groupBy(allSessions ?? [], "user_id");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let onboardingCompletedCount = 0;

  const adminUsers: AdminUser[] = allUsers.map((user) => {
    const progress = progressByUser[user.id] ?? [];
    const milestones = milestonesByUser[user.id] ?? [];
    const sessions = sessionsByUser[user.id] ?? [];

    // Current stage: latest completed stage
    const completedStages = progress
      .filter((p) => p.status === "completed")
      .map((p) => p.stage);
    const stageOrder = [
      "onboarding", "module_1", "module_2", "module_3", "module_4",
      "battle_1", "battle_2", "battle_3",
    ];
    let currentStage = "Not Started";
    for (let i = stageOrder.length - 1; i >= 0; i--) {
      if (completedStages.includes(stageOrder[i] as UserProgress["stage"])) {
        currentStage = formatStageName(stageOrder[i]);
        break;
      }
    }

    // Sessions completed
    const sessionsCompleted = sessions.filter((s) => s.status === "done").length;

    // Last active: most recent of updated_at, any progress completed_at, any session date_completed
    const dates: string[] = [user.updated_at];
    progress.forEach((p) => { if (p.completed_at) dates.push(p.completed_at); });
    sessions.forEach((s) => { if (s.date_completed) dates.push(s.date_completed); });
    const lastActive = dates.sort().reverse()[0] ?? user.created_at;

    if (user.onboarding_completed) onboardingCompletedCount++;

    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      company_name: user.company_name,
      industry: user.industry,
      role_title: user.role_title,
      current_stage: currentStage,
      sessions_completed: sessionsCompleted,
      last_active: lastActive,
      milestones,
      progress_records: progress,
      war_sessions: sessions,
    };
  });

  // Active users: any user with activity in last 7 days
  const activeUsersLast7Days = adminUsers.filter(
    (u) => new Date(u.last_active) >= sevenDaysAgo
  ).length;

  const averageOnboardingRate =
    allUsers.length > 0
      ? Math.round((onboardingCompletedCount / allUsers.length) * 100)
      : 0;

  return {
    success: true,
    data: {
      stats: {
        totalUsers: allUsers.length,
        activeUsersLast7Days,
        averageOnboardingRate,
      },
      users: adminUsers,
    },
  };
}

// ---------------------------------------------------------------------------
// Check if current user is admin
// ---------------------------------------------------------------------------

export async function checkIsAdmin(): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  const { isAdmin } = await verifyAdmin(token);
  return isAdmin;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function groupBy<T>(
  items: T[],
  key: keyof T
): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of items) {
    const k = String(item[key]);
    if (!map[k]) map[k] = [];
    map[k].push(item);
  }
  return map;
}

function formatStageName(stage: string): string {
  const map: Record<string, string> = {
    onboarding: "Onboarding",
    module_1: "Module 1",
    module_2: "Module 2",
    module_3: "Module 3",
    module_4: "Module 4",
    battle_1: "Battle 1",
    battle_2: "Battle 2",
    battle_3: "Battle 3",
  };
  return map[stage] ?? stage;
}
