import { insforgeClient, insforgeEmail } from "@/lib/insforge";
import { MODULES } from "@/lib/masterclass-data";
import type {
  LessonCompletion,
  SuccessNugget,
  UserProgress,
  WarBattleSession,
} from "@/db/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Runs weekly via Vercel Cron (see vercel.json). Vercel sends
// `Authorization: Bearer ${CRON_SECRET}` automatically when the env var is set.

const ADMIN_KEY = process.env.INSFORGE_API_KEY ?? "";

interface DigestUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  notify_weekly_digest: boolean;
}

function digestTemplate(params: {
  firstName: string;
  lessonsThisWeek: number;
  sessionsThisWeek: number;
  nuggetsThisWeek: number;
  lessonsTotal: number;
  lessonsMax: number;
  currentModule: number;
}): { subject: string; html: string } {
  const {
    firstName,
    lessonsThisWeek,
    sessionsThisWeek,
    nuggetsThisWeek,
    lessonsTotal,
    lessonsMax,
    currentModule,
  } = params;

  const hadActivity = lessonsThisWeek + sessionsThisWeek + nuggetsThisWeek > 0;

  const statRow = (label: string, value: number) => `
    <tr>
      <td style="padding:8px 16px 8px 0;color:#6B7280;">${label}</td>
      <td style="padding:8px 0;font-weight:600;color:#08376B;">${value}</td>
    </tr>`;

  const opener = hadActivity
    ? `<p>Here’s what you accomplished on Manager Elevator this week:</p>`
    : `<p>It was a quiet week on Manager Elevator — your CI journey is waiting for you. Even one lesson keeps the momentum going.</p>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#F5F7FA;font-family:'Montserrat',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F7FA;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background-color:#08376B;padding:24px 32px;text-align:center;">
              <img src="https://app.managerelevator.com/manager-elevator_logo_white_mint.png" alt="Manager Elevator" width="180" style="display:block;margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0;font-size:22px;color:#08376B;">Your Weekly Progress Digest</h1>
              <p style="font-size:14px;line-height:1.6;color:#1C2733;">Hi ${firstName},</p>
              ${opener}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#F5F7FA;border-radius:8px;padding:16px;">
                <tr><td style="padding:16px 16px 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6B7280;" colspan="2">This Week</td></tr>
                <tr><td style="padding:0 16px;" colspan="2">
                  <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
                    ${statRow("Lessons completed", lessonsThisWeek)}
                    ${statRow("WAR Battle sessions", sessionsThisWeek)}
                    ${statRow("Success Nuggets created", nuggetsThisWeek)}
                  </table>
                </td></tr>
                <tr><td style="padding:12px 16px 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6B7280;border-top:1px solid #E8ECF0;" colspan="2">Overall</td></tr>
                <tr><td style="padding:0 16px 16px;" colspan="2">
                  <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
                    ${statRow("Lessons completed", lessonsTotal)}
                    <tr>
                      <td style="padding:8px 16px 8px 0;color:#6B7280;">Currently on</td>
                      <td style="padding:8px 0;font-weight:600;color:#08376B;">Module ${currentModule}</td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;text-align:center;">
              <a href="https://app.managerelevator.com/dashboard" style="display:inline-block;background-color:#35C0ED;color:#ffffff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;">Continue Your Journey</a>
              <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF;">You can turn this digest off any time in Settings → Notification Preferences.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F5F7FA;padding:16px 32px;text-align:center;font-size:12px;color:#6B7280;">
              Manager Elevator &mdash; Transformational Growth Enterprises LLC
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const subject = hadActivity
    ? `Your week on Manager Elevator: ${lessonsThisWeek} lesson${lessonsThisWeek !== 1 ? "s" : ""}, ${lessonsTotal} of ${lessonsMax} overall`
    : "Your Manager Elevator weekly check-in";

  return { subject, html };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional ?to=email — restrict the run to a single recipient (manual testing)
  const onlyTo = new URL(request.url).searchParams.get("to");

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // The admin key acts as project_admin (bypasses RLS) — required here because
  // the cron has no user session and must read every opted-in user.
  const { data: users, error: usersError } = await insforgeClient
    .from("users")
    .select<DigestUser[]>(
      ADMIN_KEY,
      `?notify_weekly_digest=eq.true&role=eq.user&select=id,email,full_name,role,notify_weekly_digest`
    );

  if (usersError) {
    return Response.json({ error: `Failed to fetch users: ${usersError}` }, { status: 500 });
  }

  const totalLessonsMax = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
  let sent = 0;
  const failures: string[] = [];

  const recipients = (users ?? []).filter(
    (u) => !onlyTo || u.email.toLowerCase() === onlyTo.toLowerCase()
  );

  for (const user of recipients) {
    try {
      const [completions, sessions, nuggets, progress] = await Promise.all([
        insforgeClient
          .from("lesson_completions")
          .select<LessonCompletion[]>(ADMIN_KEY, `?user_id=eq.${user.id}`),
        insforgeClient
          .from("war_battle_sessions")
          .select<WarBattleSession[]>(
            ADMIN_KEY,
            `?user_id=eq.${user.id}&status=eq.done&date_completed=gte.${weekAgo}`
          ),
        insforgeClient
          .from("success_nuggets")
          .select<SuccessNugget[]>(ADMIN_KEY, `?user_id=eq.${user.id}&created_at=gte.${weekAgo}`),
        insforgeClient
          .from("user_progress")
          .select<UserProgress[]>(ADMIN_KEY, `?user_id=eq.${user.id}`),
      ]);

      const allCompletions = completions.data ?? [];
      const progressRecords = progress.data ?? [];

      const completedModules = new Set<string>(
        progressRecords
          .filter((p) => p.status === "completed" && p.stage.startsWith("module_"))
          .map((p) => p.stage)
      );

      // Same union as the masterclass page: individually checked lessons, plus
      // every lesson in a module whose quiz was passed.
      const lessonsTotal = MODULES.reduce((sum, m) => {
        if (completedModules.has(m.stage)) return sum + m.lessons.length;
        return (
          sum +
          m.lessons.filter((lesson) =>
            allCompletions.some(
              (c) => c.module_number === m.number && c.lesson_number === lesson.number
            )
          ).length
        );
      }, 0);

      let currentModule = 1;
      for (let i = 4; i >= 1; i--) {
        if (progressRecords.some((p) => p.stage === `module_${i}`)) {
          currentModule = i;
          break;
        }
      }

      const { subject, html } = digestTemplate({
        firstName: user.full_name?.split(" ")[0] || "there",
        lessonsThisWeek: allCompletions.filter((c) => c.completed_at >= weekAgo).length,
        sessionsThisWeek: (sessions.data ?? []).length,
        nuggetsThisWeek: (nuggets.data ?? []).length,
        lessonsTotal,
        lessonsMax: totalLessonsMax,
        currentModule,
      });

      await insforgeEmail.send({ to: user.email, subject, html });
      sent += 1;

      // Stay under Resend's 2 req/sec rate limit
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error(`[weekly-digest] Failed for ${user.email}:`, err);
      failures.push(user.email);
    }
  }

  return Response.json({ ok: true, sent, failed: failures.length, failures });
}
