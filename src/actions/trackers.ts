"use server";

import { insforgeClient, insforgeAuth, insforgeAI } from "@/lib/insforge";
import { cookies } from "next/headers";
import type {
  WarBattleSession,
  ImprovementOpportunity,
  OpportunityPriority,
  OpportunityStatus,
  WinningSolution,
  MetricType,
  SuccessNugget,
  NuggetSource,
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

// ---------------------------------------------------------------------------
// Winning Solutions — CRUD
// ---------------------------------------------------------------------------

export async function getWinningSolutions(): Promise<{
  success: boolean;
  error?: string;
  data?: WinningSolution[];
}> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  const { data, error } = await insforgeClient
    .from("winning_solutions")
    .select<WinningSolution[]>(
      token,
      `?user_id=eq.${userId}&order=created_at.desc`
    );

  if (error) return { success: false, error };
  return { success: true, data: data ?? [] };
}

export async function createWinningSolution(fields: {
  title: string;
  problem_addressed: string;
  description: string;
  metric_type: MetricType;
  before_value: number | null;
  after_value: number | null;
  unit: string;
  date_implemented: string | null;
  notes: string;
}): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  const { error } = await insforgeClient
    .from("winning_solutions")
    .insert({ user_id: userId, ...fields }, token);

  if (error) return { success: false, error };
  return { success: true };
}

export async function deleteWinningSolution(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const { error } = await insforgeClient
    .from("winning_solutions")
    .delete(token, `?id=eq.${id}`);

  if (error) return { success: false, error };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Success Nuggets — CRUD
// ---------------------------------------------------------------------------

export async function getSuccessNuggets(): Promise<{
  success: boolean;
  error?: string;
  data?: SuccessNugget[];
}> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  const { data, error } = await insforgeClient
    .from("success_nuggets")
    .select<SuccessNugget[]>(
      token,
      `?user_id=eq.${userId}&order=created_at.desc`
    );

  if (error) return { success: false, error };
  return { success: true, data: data ?? [] };
}

export async function createSuccessNugget(fields: {
  achievement_statement: string;
  supporting_metrics: string;
  talking_points: string;
  source?: NuggetSource;
}): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  const { error } = await insforgeClient
    .from("success_nuggets")
    .insert(
      { user_id: userId, source: "manual", ...fields },
      token
    );

  if (error) return { success: false, error };
  return { success: true };
}

export async function updateSuccessNugget(
  id: string,
  fields: {
    achievement_statement: string;
    supporting_metrics: string;
    talking_points: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const { error } = await insforgeClient
    .from("success_nuggets")
    .update(fields, token, `?id=eq.${id}`);

  if (error) return { success: false, error };
  return { success: true };
}

export async function deleteSuccessNugget(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const { error } = await insforgeClient
    .from("success_nuggets")
    .delete(token, `?id=eq.${id}`);

  if (error) return { success: false, error };
  return { success: true };
}

// ---------------------------------------------------------------------------
// AI-Powered Nugget Generation
// ---------------------------------------------------------------------------

export interface GeneratedNugget {
  achievement_statement: string;
  supporting_metrics: string;
  talking_points: string;
}

export async function generateSuccessNuggets(): Promise<{
  success: boolean;
  error?: string;
  data?: GeneratedNugget[];
}> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  // Collect tracker data for context
  const [opportunitiesRes, solutionsRes, sessionsRes] = await Promise.all([
    insforgeClient
      .from("improvement_opportunities")
      .select<ImprovementOpportunity[]>(
        token,
        `?user_id=eq.${userId}&status=eq.completed&order=created_at.desc&limit=20`
      ),
    insforgeClient
      .from("winning_solutions")
      .select<WinningSolution[]>(
        token,
        `?user_id=eq.${userId}&order=created_at.desc&limit=20`
      ),
    insforgeClient
      .from("war_battle_sessions")
      .select<WarBattleSession[]>(
        token,
        `?user_id=eq.${userId}&status=eq.done&order=week_number.asc`
      ),
  ]);

  const opportunities = opportunitiesRes.data ?? [];
  const solutions = solutionsRes.data ?? [];
  const sessions = sessionsRes.data ?? [];

  if (
    opportunities.length === 0 &&
    solutions.length === 0 &&
    sessions.length === 0
  ) {
    return {
      success: false,
      error:
        "You need to complete some tracker activities first — finish WAR Battle sessions, log improvement opportunities, or document winning solutions before generating nuggets.",
    };
  }

  // Build context string from tracker data
  const contextParts: string[] = [];

  if (opportunities.length > 0) {
    contextParts.push(
      "COMPLETED IMPROVEMENT OPPORTUNITIES:\n" +
        opportunities
          .map(
            (o) =>
              `- ${o.title}: ${o.description} (Priority: ${o.priority}, Category: ${o.category})`
          )
          .join("\n")
    );
  }

  if (solutions.length > 0) {
    contextParts.push(
      "WINNING SOLUTIONS WITH METRICS:\n" +
        solutions
          .map((s) => {
            let metric = "";
            if (s.before_value != null && s.after_value != null) {
              const diff = Math.abs(s.before_value - s.after_value);
              const pct =
                s.before_value !== 0
                  ? Math.round(
                      (Math.abs(s.before_value - s.after_value) /
                        s.before_value) *
                        100
                    )
                  : 0;
              metric = ` | Before: ${s.before_value} ${s.unit} → After: ${s.after_value} ${s.unit} (${diff} ${s.unit} improvement, ${pct}%)`;
            }
            return `- ${s.title}: ${s.problem_addressed}. ${s.description}${metric}`;
          })
          .join("\n")
    );
  }

  if (sessions.length > 0) {
    contextParts.push(
      "COMPLETED WAR BATTLE SESSIONS:\n" +
        sessions.map((s) => `- Week ${s.week_number}: ${s.session_name}`).join("\n")
    );
  }

  const trackerContext = contextParts.join("\n\n");

  const systemPrompt = `You are a career advancement coach specializing in helping managers create powerful success summaries for performance reviews, promotion conversations, and career storytelling.

Given the user's continuous improvement (CI) tracker data below, generate 3-5 achievement summaries ("success nuggets") they can use in professional settings.

Each nugget MUST include:
1. achievement_statement: A concise, powerful statement of what was accomplished (2-3 sentences). Use active voice, quantify impact where possible, and frame it for career advancement.
2. supporting_metrics: Specific numbers and data points that back up the achievement (use the before/after data when available).
3. talking_points: 2-3 bullet points the user can reference when discussing this achievement in meetings or reviews.

Format your response as a JSON array of objects with keys: achievement_statement, supporting_metrics, talking_points.

Guidelines:
- Frame achievements in terms of business value and leadership impact
- Use language appropriate for performance reviews and promotion conversations
- Emphasize the user's initiative, methodology, and measurable results
- If metric data is available, highlight the percentage improvements prominently
- Each nugget should be distinct — don't repeat similar achievements
- Be specific, not generic — reference actual projects and metrics from the data

Respond ONLY with valid JSON — no markdown, no code fences, no extra text.`;

  const userPrompt = `Here is my CI tracker data. Please generate success nuggets from this:\n\n${trackerContext}`;

  const { data: aiResponse, error: aiError } = await insforgeAI.chatCompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2048,
  });

  if (aiError || !aiResponse) {
    return {
      success: false,
      error: "AI generation failed. Please try again in a moment.",
    };
  }

  const rawContent = aiResponse.choices?.[0]?.message?.content ?? "";

  // Parse JSON from AI response
  try {
    const nuggets: GeneratedNugget[] = JSON.parse(rawContent);

    if (!Array.isArray(nuggets) || nuggets.length === 0) {
      return { success: false, error: "AI returned an unexpected format. Please try again." };
    }

    // Validate each nugget has the required fields
    const validated = nuggets
      .filter(
        (n) =>
          typeof n.achievement_statement === "string" &&
          typeof n.supporting_metrics === "string" &&
          typeof n.talking_points === "string"
      )
      .slice(0, 5);

    if (validated.length === 0) {
      return { success: false, error: "AI returned an unexpected format. Please try again." };
    }

    return { success: true, data: validated };
  } catch {
    return { success: false, error: "Failed to parse AI response. Please try again." };
  }
}

export async function saveGeneratedNuggets(
  nuggets: GeneratedNugget[]
): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  // Save each nugget sequentially
  for (const nugget of nuggets) {
    const { error } = await insforgeClient
      .from("success_nuggets")
      .insert(
        {
          user_id: userId,
          source: "ai_generated",
          achievement_statement: nugget.achievement_statement,
          supporting_metrics: nugget.supporting_metrics,
          talking_points: nugget.talking_points,
        },
        token
      );
    if (error) return { success: false, error };
  }

  return { success: true };
}
