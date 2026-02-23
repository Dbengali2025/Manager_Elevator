"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { cookies } from "next/headers";
import type {
  WarBattleSession,
  ImprovementOpportunity,
  OpportunityPriority,
  OpportunityStatus,
} from "@/db/types";
import type { UserRecord } from "@/lib/insforge";
import { WAR_BATTLE_SESSIONS } from "@/actions/masterclass";
import { notifySessionCompleted } from "@/actions/notifications";

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

  let powerpointLink: string | null = null;

  if (existing && existing.length > 0) {
    powerpointLink = existing[0].powerpoint_link;
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

  // Fire-and-forget: notify Dana of session completion
  insforgeClient
    .from("users")
    .select<UserRecord[]>(token, `?id=eq.${userId}`)
    .then(({ data: users }) => {
      const user = users?.[0];
      if (user) {
        notifySessionCompleted({
          userName: user.full_name,
          company: user.company_name,
          sessionNumber: weekNumber,
          sessionName: sessionDef.name,
          dateCompleted: now,
          powerpointLink,
        }).catch((err) => console.error("Notification error:", err));
      }
    })
    .catch((err) => console.error("Failed to fetch user for notification:", err));

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

// ---------------------------------------------------------------------------
// Improvement Opportunities — CRUD
// ---------------------------------------------------------------------------

export async function getOpportunities(): Promise<{
  success: boolean;
  error?: string;
  data?: ImprovementOpportunity[];
}> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  const { data, error } = await insforgeClient
    .from("improvement_opportunities")
    .select<ImprovementOpportunity[]>(
      token,
      `?user_id=eq.${userId}&order=created_at.desc`
    );

  if (error) return { success: false, error };
  return { success: true, data: data ?? [] };
}

export async function createOpportunity(fields: {
  title: string;
  description: string;
  priority: OpportunityPriority;
  category: string;
  status: OpportunityStatus;
}): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  const { error } = await insforgeClient
    .from("improvement_opportunities")
    .insert({ user_id: userId, ...fields }, token);

  if (error) return { success: false, error };
  return { success: true };
}

export async function updateOpportunityStatus(
  id: string,
  status: OpportunityStatus
): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const { error } = await insforgeClient
    .from("improvement_opportunities")
    .update({ status }, token, `?id=eq.${id}`);

  if (error) return { success: false, error };
  return { success: true };
}

export async function deleteOpportunity(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const { error } = await insforgeClient
    .from("improvement_opportunities")
    .delete(token, `?id=eq.${id}`);

  if (error) return { success: false, error };
  return { success: true };
}
