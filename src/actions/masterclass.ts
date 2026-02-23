"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { cookies } from "next/headers";
import type { UserProgress, WarBattleSession } from "@/db/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MasterclassData {
  userName: string;
  progressRecords: UserProgress[];
  sessions: WarBattleSession[];
}

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
// Session names — 14-week WAR Battle sessions from TGE Offerings
// ---------------------------------------------------------------------------

export const WAR_BATTLE_SESSIONS = [
  { week: 1, name: "Step 1 \u2013 Clarify the Opportunity", battle: 1 },
  { week: 2, name: "Step 2 \u2013 Define the Success Metrics", battle: 1 },
  { week: 3, name: "Step 3 \u2013 Confirm the Current State", battle: 1 },
  { week: 4, name: "Step 3 continued \u2013 Confirm the Current State", battle: 1 },
  { week: 5, name: "Step 4 \u2013 Determine Pain and Root Causes", battle: 1 },
  { week: 6, name: "Step 4 continued \u2013 Determine Pain and Root Causes", battle: 1 },
  { week: 7, name: "Step 5 \u2013 Define the Ideal Future State", battle: 2 },
  { week: 8, name: "Step 6 \u2013 Brainstorm Potential Solutions", battle: 2 },
  { week: 9, name: "Step 6 continued \u2013 Brainstorm Potential Solutions", battle: 2 },
  { week: 10, name: "Step 7 \u2013 Test Potential Solutions & Step 8 \u2013 Measure the Improvement", battle: 2 },
  { week: 11, name: "Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement", battle: 2 },
  { week: 12, name: "Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement", battle: 2 },
  { week: 13, name: "Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement", battle: 3 },
  { week: 14, name: "Step 9 \u2013 Implement the Winning Solutions & Step 10 \u2013 Share and Sustain", battle: 3 },
];

// ---------------------------------------------------------------------------
// Module + Lesson definitions from TGE Offerings
// ---------------------------------------------------------------------------

export interface Lesson {
  number: number;
  title: string;
}

export interface Module {
  number: number;
  title: string;
  lessons: Lesson[];
  stage: string; // matches ProgressStage e.g. "module_1"
}

export const MODULES: Module[] = [
  {
    number: 1,
    title: "The Value of Illuminating Workplace Problems",
    lessons: [
      { number: 1, title: "The Problem: Middle-Managers Are Undervalued" },
      { number: 2, title: "Creating Value: Introduction to the Continuous Improvement Done Right Formula" },
      { number: 3, title: "Waste Warrior Exercise #1 \u2013 Recognizing problems by identifying workplace waste" },
      { number: 4, title: "Waste Warrior Exercise #2 \u2013 Prioritizing which problems to fix" },
      { number: 5, title: "Waste Warrior Exercise #3 \u2013 Completing a SIPOC diagram for the problem" },
      { number: 6, title: "Waste Warrior Exercise #4 \u2013 Developing the Problem Statement paragraph" },
      { number: 7, title: "How to Maximize the Next 30 Days in Your Current Manager Assignment" },
    ],
    stage: "module_1",
  },
  {
    number: 2,
    title: "Investigating Root Causes for Success",
    lessons: [
      { number: 1, title: "Introducing the Waste WAR Battle 10 Steps for CI Success" },
      { number: 2, title: "Waste WAR Battle Session #1: Step 1 \u2013 Clarify the Opportunity" },
      { number: 3, title: "Waste WAR Battle Session #2: Step 2 \u2013 Define the Success Metrics" },
      { number: 4, title: "Waste WAR Battle Session #3: Step 3 \u2013 Confirm the Current State" },
      { number: 5, title: "Waste WAR Battle Session #4: Step 3 continued \u2013 Confirm the Current State" },
      { number: 6, title: "Waste WAR Battle Session #5: Step 4 \u2013 Determine Pain and Root Causes" },
      { number: 7, title: "Waste WAR Battle Session #6: Step 4 continued \u2013 Determine Pain and Root Causes" },
    ],
    stage: "module_2",
  },
  {
    number: 3,
    title: "Intelligently Testing Potential Solutions",
    lessons: [
      { number: 1, title: "Waste WAR Battle Session #7: Step 5 \u2013 Define the Ideal Future State" },
      { number: 2, title: "Waste WAR Battle Session #8: Step 6 \u2013 Brainstorm Potential Solutions" },
      { number: 3, title: "Waste WAR Battle Session #9: Step 6 continued \u2013 Brainstorm Potential Solutions" },
      { number: 4, title: "Waste WAR Battle Session #10: Step 7 \u2013 Test Potential Solutions & Step 8 \u2013 Measure the Improvement" },
      { number: 5, title: "Waste WAR Battle Session #11: Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement" },
      { number: 6, title: "Waste WAR Battle Session #12: Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement" },
      { number: 7, title: "Waste WAR Battle Session #13: Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement" },
    ],
    stage: "module_3",
  },
  {
    number: 4,
    title: "Implementing Winning Solutions for Success",
    lessons: [
      { number: 1, title: "Waste WAR Battle Session #14: Step 9 \u2013 Implement the Winning Solutions & Step 10 \u2013 Share and Sustain the Results" },
      { number: 2, title: "How to Maximize the First 100 Days of a New Manager Assignment" },
      { number: 3, title: "Solidifying Your Continuous Improvement Team Culture" },
      { number: 4, title: "Creating Extra Income as a Bulletproof Continuous Improvement Consultant" },
    ],
    stage: "module_4",
  },
];

// ---------------------------------------------------------------------------
// Get masterclass data
// ---------------------------------------------------------------------------

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

  // Check if a session record exists for this week
  const { data: existing } = await insforgeClient
    .from("war_battle_sessions")
    .select<WarBattleSession[]>(
      token,
      `?user_id=eq.${userId}&week_number=eq.${weekNumber}`
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
  const doneWeeks = new Set(doneSessions.map((s) => s.week_number));

  // Module completion mapping:
  // Module 1 lessons correspond to sessions 1-6 (weeks 1-6 of battle 1)
  // Module 2 lessons correspond to sessions 7 (week 7 = battle 2 start)
  // But for simplicity: checking sessions marks the module's sessions as done.
  // The session checklist is a separate tracking mechanism.
  // Module progress is tracked independently via the session checklist UI.

  // Count sessions done per battle
  const battle1Done = doneSessions.filter((s) => s.battle_number === 1).length;
  const battle1Total = WAR_BATTLE_SESSIONS.filter((s) => s.battle === 1).length; // 6

  const battle2Done = doneSessions.filter((s) => s.battle_number === 2).length;
  const battle2Total = WAR_BATTLE_SESSIONS.filter((s) => s.battle === 2).length; // 6

  const battle3Done = doneSessions.filter((s) => s.battle_number === 3).length;
  const battle3Total = WAR_BATTLE_SESSIONS.filter((s) => s.battle === 3).length; // 2

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
