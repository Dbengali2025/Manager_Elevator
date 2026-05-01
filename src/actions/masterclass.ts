"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { getValidToken } from "@/lib/auth-helpers";
import { WAR_BATTLE_SESSIONS } from "@/lib/masterclass-data";
import type { UserProgress, WarBattleSession } from "@/db/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getToken = getValidToken;

async function getUserId(token: string): Promise<string | null> {
  const { data: authUser, error } = await insforgeAuth.getUser(token);
  if (error || !authUser) return null;
  return authUser.id;
}

// ---------------------------------------------------------------------------
// Get masterclass data
// ---------------------------------------------------------------------------

export interface MasterclassData {
  userName: string;
  progressRecords: UserProgress[];
  sessions: WarBattleSession[];
}

export async function getMasterclassData(): Promise<{
  success: boolean;
  error?: string;
  data?: MasterclassData;
}> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const userId = await getUserId(token);
  if (!userId) {
    return { success: false, error: "Failed to get user info" };
  }

  // Fetch user name
  const { data: users, error: userError } = await insforgeClient
    .from("users")
    .select<Array<{ full_name: string }>>(
      token,
      `?id=eq.${userId}&select=full_name`
    );

  if (userError || !users || users.length === 0) {
    return { success: false, error: "User profile not found" };
  }

  // Fetch progress records
  const { data: progress } = await insforgeClient
    .from("user_progress")
    .select<UserProgress[]>(
      token,
      `?user_id=eq.${userId}&order=created_at.asc`
    );

  // Fetch WAR battle sessions
  const { data: sessions } = await insforgeClient
    .from("war_battle_sessions")
    .select<WarBattleSession[]>(
      token,
      `?user_id=eq.${userId}&order=week_number.asc`
    );

  return {
    success: true,
    data: {
      userName: users[0].full_name,
      progressRecords: progress ?? [],
      sessions: sessions ?? [],
    },
  };
}

// ---------------------------------------------------------------------------
// Toggle session completion (check/uncheck)
// ---------------------------------------------------------------------------

export async function toggleSessionCompletion(
  weekNumber: number,
  sessionName: string,
  battleNumber: number,
  completed: boolean
): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const userId = await getUserId(token);
  if (!userId) {
    return { success: false, error: "Failed to get user info" };
  }

  // Check if a session record exists for this week + battle combo
  const { data: existing } = await insforgeClient
    .from("war_battle_sessions")
    .select<WarBattleSession[]>(
      token,
      `?user_id=eq.${userId}&week_number=eq.${weekNumber}&battle_number=eq.${battleNumber}`
    );

  if (completed) {
    if (existing && existing.length > 0) {
      // Update existing to done
      await insforgeClient
        .from("war_battle_sessions")
        .update(
          {
            status: "done",
            date_completed: new Date().toISOString(),
          },
          token,
          `?id=eq.${existing[0].id}`
        );
    } else {
      // Create new session record as done
      await insforgeClient
        .from("war_battle_sessions")
        .insert(
          {
            user_id: userId,
            battle_number: battleNumber,
            week_number: weekNumber,
            session_name: sessionName,
            status: "done",
            date_completed: new Date().toISOString(),
          },
          token
        );
    }
  } else {
    // Unchecking — set status back to pending
    if (existing && existing.length > 0) {
      await insforgeClient
        .from("war_battle_sessions")
        .update(
          {
            status: "pending",
            date_completed: null,
          },
          token,
          `?id=eq.${existing[0].id}`
        );
    }
  }

  // Check if all sessions in a module's battle range are now complete
  // and update user_progress accordingly
  await updateModuleProgress(userId, token);

  return { success: true };
}

// ---------------------------------------------------------------------------
// Update module progress based on session completions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Get lesson resources
// ---------------------------------------------------------------------------

export interface LessonResource {
  id: string;
  module_number: number;
  lesson_number: number;
  display_name: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
}

export async function getLessonResources(): Promise<{
  success: boolean;
  error?: string;
  data?: LessonResource[];
}> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await insforgeClient
    .from("lesson_resources")
    .select<LessonResource[]>(
      token,
      `?order=module_number.asc,lesson_number.asc,display_name.asc`
    );

  if (error) {
    return { success: false, error };
  }

  return { success: true, data: data ?? [] };
}

// ---------------------------------------------------------------------------
// Update module progress based on session completions
// ---------------------------------------------------------------------------

async function updateModuleProgress(
  userId: string,
  token: string
): Promise<void> {
  // Fetch all sessions for this user
  const { data: allSessions } = await insforgeClient
    .from("war_battle_sessions")
    .select<WarBattleSession[]>(
      token,
      `?user_id=eq.${userId}&order=week_number.asc`
    );

  const sessions = allSessions ?? [];
  const doneSessions = sessions.filter((s) => s.status === "done");

  // Count sessions done per battle
  const battle1Done = doneSessions.filter((s) => s.battle_number === 1).length;
  const battle1Total = WAR_BATTLE_SESSIONS.filter((s) => s.battle === 1).length;

  const battle2Done = doneSessions.filter((s) => s.battle_number === 2).length;
  const battle2Total = WAR_BATTLE_SESSIONS.filter((s) => s.battle === 2).length;

  const battle3Done = doneSessions.filter((s) => s.battle_number === 3).length;
  const battle3Total = WAR_BATTLE_SESSIONS.filter((s) => s.battle === 3).length;

  // Update battle progress stages
  const battleStages = [
    { stage: "battle_1", done: battle1Done, total: battle1Total },
    { stage: "battle_2", done: battle2Done, total: battle2Total },
    { stage: "battle_3", done: battle3Done, total: battle3Total },
  ];

  for (const { stage, done, total } of battleStages) {
    if (done > 0) {
      const status = done >= total ? "completed" : "in_progress";

      // Check if progress record exists
      const { data: existing } = await insforgeClient
        .from("user_progress")
        .select<UserProgress[]>(
          token,
          `?user_id=eq.${userId}&stage=eq.${stage}`
        );

      if (existing && existing.length > 0) {
        if (existing[0].status !== status) {
          await insforgeClient
            .from("user_progress")
            .update(
              {
                status,
                completed_at: status === "completed" ? new Date().toISOString() : null,
              },
              token,
              `?id=eq.${existing[0].id}`
            );
        }
      } else {
        await insforgeClient
          .from("user_progress")
          .insert(
            {
              user_id: userId,
              stage,
              status,
              completed_at: status === "completed" ? new Date().toISOString() : null,
            },
            token
          );
      }
    }
  }
}
