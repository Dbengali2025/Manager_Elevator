"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { cookies } from "next/headers";
import type { WarBattleSession } from "@/db/types";
import { WAR_BATTLE_SESSIONS } from "@/actions/masterclass";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value ?? null;
}

async function getUserId(token: string): Promise<string | null> {
  const { data: authUser, error } = await insforgeAuth.getUser(token);
  if (error || !authUser) return null;
  return authUser.id;
}

// ---------------------------------------------------------------------------
// Get WAR Battle sessions for tracker
// ---------------------------------------------------------------------------

export async function getWarBattleSessions(): Promise<{
  success: boolean;
  error?: string;
  data?: WarBattleSession[];
}> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  const { data: sessions, error } = await insforgeClient
    .from("war_battle_sessions")
    .select<WarBattleSession[]>(
      token,
      `?user_id=eq.${userId}&order=week_number.asc`
    );

  if (error) return { success: false, error };

  return { success: true, data: sessions ?? [] };
}

// ---------------------------------------------------------------------------
// Mark a WAR Battle session as complete
// ---------------------------------------------------------------------------

export async function markSessionComplete(
  weekNumber: number
): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  const sessionDef = WAR_BATTLE_SESSIONS.find((s) => s.week === weekNumber);
  if (!sessionDef) return { success: false, error: "Invalid week number" };

  // Check if a session record exists
  const { data: existing } = await insforgeClient
    .from("war_battle_sessions")
    .select<WarBattleSession[]>(
      token,
      `?user_id=eq.${userId}&week_number=eq.${weekNumber}`
    );

  const now = new Date().toISOString();

  if (existing && existing.length > 0) {
    await insforgeClient
      .from("war_battle_sessions")
      .update(
        { status: "done", date_completed: now },
        token,
        `?id=eq.${existing[0].id}`
      );
  } else {
    await insforgeClient
      .from("war_battle_sessions")
      .insert(
        {
          user_id: userId,
          battle_number: sessionDef.battle,
          week_number: weekNumber,
          session_name: sessionDef.name,
          status: "done",
          date_completed: now,
          powerpoint_link: null,
        },
        token
      );
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Save PowerPoint link for a session
// ---------------------------------------------------------------------------

export async function saveSessionLink(
  weekNumber: number,
  link: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  const sessionDef = WAR_BATTLE_SESSIONS.find((s) => s.week === weekNumber);
  if (!sessionDef) return { success: false, error: "Invalid week number" };

  // Check if a session record exists
  const { data: existing } = await insforgeClient
    .from("war_battle_sessions")
    .select<WarBattleSession[]>(
      token,
      `?user_id=eq.${userId}&week_number=eq.${weekNumber}`
    );

  if (existing && existing.length > 0) {
    await insforgeClient
      .from("war_battle_sessions")
      .update(
        { powerpoint_link: link || null },
        token,
        `?id=eq.${existing[0].id}`
      );
  } else {
    // Create a pending session with the link
    await insforgeClient
      .from("war_battle_sessions")
      .insert(
        {
          user_id: userId,
          battle_number: sessionDef.battle,
          week_number: weekNumber,
          session_name: sessionDef.name,
          status: "pending",
          date_completed: null,
          powerpoint_link: link || null,
        },
        token
      );
  }

  return { success: true };
}
