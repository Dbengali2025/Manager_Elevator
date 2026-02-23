"use server";

import { insforgeEmail } from "@/lib/insforge";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DANA_EMAIL =
  process.env.DANA_NOTIFICATION_EMAIL ?? "danat4lssplus@gmail.com";

const LOGO_URL = "https://managerelevator.com/manager-elevator_logo.png";

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------

function emailTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#F5F7FA;font-family:'Montserrat',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F7FA;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background-color:#08376B;padding:24px 32px;text-align:center;">
              <img src="${LOGO_URL}" alt="Manager Elevator" width="180" style="display:block;margin:0 auto;" />
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="padding:32px 32px 16px;text-align:center;">
              <h1 style="margin:0;font-size:22px;color:#08376B;font-family:'Tenor Sans','Georgia',serif;">${title}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 32px;font-size:14px;line-height:1.6;color:#1C2733;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
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
}

// ---------------------------------------------------------------------------
// Notification: WAR Battle session completed
// ---------------------------------------------------------------------------

export async function notifySessionCompleted(params: {
  userName: string;
  company: string;
  sessionNumber: number;
  sessionName: string;
  dateCompleted: string;
  powerpointLink: string | null;
}): Promise<void> {
  const { userName, company, sessionNumber, sessionName, dateCompleted, powerpointLink } = params;

  const formattedDate = new Date(dateCompleted).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const linkRow = powerpointLink
    ? `<tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">PowerPoint Link:</td>
        <td style="padding:8px 0;"><a href="${powerpointLink}" style="color:#35C0ED;text-decoration:underline;">${powerpointLink}</a></td>
       </tr>`
    : `<tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">PowerPoint Link:</td>
        <td style="padding:8px 0;color:#6B7280;font-style:italic;">Not provided</td>
       </tr>`;

  const body = `
    <p>A user has completed a WAR Battle session:</p>
    <table role="presentation" style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">User:</td>
        <td style="padding:8px 0;font-weight:600;">${userName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">Company:</td>
        <td style="padding:8px 0;">${company}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">Session:</td>
        <td style="padding:8px 0;">Week ${sessionNumber} &mdash; ${sessionName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">Date Completed:</td>
        <td style="padding:8px 0;">${formattedDate}</td>
      </tr>
      ${linkRow}
    </table>`;

  const html = emailTemplate("WAR Battle Session Completed", body);

  try {
    await insforgeEmail.send({
      to: DANA_EMAIL,
      subject: `[Manager Elevator] ${userName} completed Week ${sessionNumber} - ${sessionName}`,
      html,
    });
  } catch (err) {
    console.error("Failed to send session completion email:", err);
  }
}

// ---------------------------------------------------------------------------
// Notification: Milestone unlocked
// ---------------------------------------------------------------------------

export async function notifyMilestoneUnlocked(params: {
  userName: string;
  company: string;
  milestoneType: "waste_eliminator" | "ci_consultant";
}): Promise<void> {
  const { userName, company, milestoneType } = params;

  const milestoneNames: Record<string, { title: string; description: string }> = {
    waste_eliminator: {
      title: "Most Valuable Workplace Waste Eliminator",
      description: "This user has completed all 4 modules and the 1st Waste WAR Battle, unlocking affiliate revenue opportunities.",
    },
    ci_consultant: {
      title: "Certified CI Done Right Consultant",
      description: "This user has completed the 2nd and 3rd Waste WAR Battles, unlocking consulting opportunities.",
    },
  };

  const milestone = milestoneNames[milestoneType];
  if (!milestone) return;

  const body = `
    <p>A user has unlocked a major milestone!</p>
    <div style="background:linear-gradient(135deg,#08376B,#2F90B0);border-radius:12px;padding:24px;margin:16px 0;text-align:center;">
      <p style="color:#9AEBA6;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Milestone Unlocked</p>
      <p style="color:#ffffff;font-size:20px;font-weight:700;margin:0;">${milestone.title}</p>
    </div>
    <table role="presentation" style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">User:</td>
        <td style="padding:8px 0;font-weight:600;">${userName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">Company:</td>
        <td style="padding:8px 0;">${company}</td>
      </tr>
    </table>
    <p style="color:#6B7280;font-size:13px;">${milestone.description}</p>`;

  const html = emailTemplate("Milestone Unlocked", body);

  try {
    await insforgeEmail.send({
      to: DANA_EMAIL,
      subject: `[Manager Elevator] ${userName} unlocked: ${milestone.title}`,
      html,
    });
  } catch (err) {
    console.error("Failed to send milestone notification email:", err);
  }
}

// ---------------------------------------------------------------------------
// Notification: New user registered
// ---------------------------------------------------------------------------

export async function notifyNewUserRegistered(params: {
  fullName: string;
  email: string;
  company: string;
  industry: string;
  roleTitle: string;
}): Promise<void> {
  const { fullName, email, company, industry, roleTitle } = params;

  const body = `
    <p>A new user has registered on Manager Elevator!</p>
    <table role="presentation" style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">Name:</td>
        <td style="padding:8px 0;font-weight:600;">${fullName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">Email:</td>
        <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#35C0ED;text-decoration:underline;">${email}</a></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">Company:</td>
        <td style="padding:8px 0;">${company}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">Industry:</td>
        <td style="padding:8px 0;">${industry}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6B7280;width:140px;vertical-align:top;">Role/Title:</td>
        <td style="padding:8px 0;">${roleTitle}</td>
      </tr>
    </table>`;

  const html = emailTemplate("New User Registered", body);

  try {
    await insforgeEmail.send({
      to: DANA_EMAIL,
      subject: `[Manager Elevator] New user: ${fullName} (${company})`,
      html,
    });
  } catch (err) {
    console.error("Failed to send new user registration email:", err);
  }
}
