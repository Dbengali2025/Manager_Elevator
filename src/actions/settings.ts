"use server";

import { insforgeClient, insforgeAuth, insforgeEmail } from "@/lib/insforge";
import { getValidToken } from "@/lib/auth-helpers";
import type { ActionResult } from "./auth";
import type { User } from "@/db/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileData {
  fullName: string;
  email: string;
  companyName: string;
  industry: string;
  roleTitle: string;
  miestroLinked: boolean;
  notifyMilestones: boolean;
  notifyWeeklyDigest: boolean;
}

// ---------------------------------------------------------------------------
// Get current user token
// ---------------------------------------------------------------------------

const getToken = getValidToken;

// ---------------------------------------------------------------------------
// Get user profile for settings page
// ---------------------------------------------------------------------------

export async function getProfileData(): Promise<{
  success: boolean;
  error?: string;
  data?: ProfileData;
}> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, error: "Failed to get user info" };
  }

  const { data: users, error: fetchError } = await insforgeClient
    .from("users")
    .select<User[]>(token, `?id=eq.${authUser.id}`);

  if (fetchError || !users || users.length === 0) {
    return { success: false, error: "User profile not found" };
  }

  const user = users[0];
  return {
    success: true,
    data: {
      fullName: user.full_name,
      email: user.email,
      companyName: user.company_name,
      industry: user.industry,
      roleTitle: user.role_title,
      miestroLinked: user.miestro_linked,
      notifyMilestones: true,
      notifyWeeklyDigest: true,
    },
  };
}

// ---------------------------------------------------------------------------
// Update user profile
// ---------------------------------------------------------------------------

export async function updateProfile(fields: {
  fullName: string;
  companyName: string;
  industry: string;
  roleTitle: string;
}): Promise<ActionResult> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, error: "Failed to get user info" };
  }

  const { error } = await insforgeClient
    .from("users")
    .update(
      {
        full_name: fields.fullName,
        company_name: fields.companyName,
        industry: fields.industry,
        role_title: fields.roleTitle,
      },
      token,
      `?id=eq.${authUser.id}`
    );

  if (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: "Failed to save changes" };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------

export async function changePassword(
  currentPassword: string,
  newPassword: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<ActionResult> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  // Get current user's email to re-authenticate
  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, error: "Failed to verify identity" };
  }

  // Verify current password by attempting login
  const { data: loginData, error: loginError } = await insforgeAuth.login(
    authUser.email,
    currentPassword
  );

  if (loginError || !loginData) {
    return { success: false, error: "Current password is incorrect" };
  }

  // Send reset password email, then user can complete via email
  // For now, trigger the reset flow using the verified session
  const { error: resetError } = await insforgeAuth.resetPassword(authUser.email);

  if (resetError) {
    return { success: false, error: "Failed to initiate password change. Please try again." };
  }

  return { success: true, error: "A password reset email has been sent to your inbox." };
}

// ---------------------------------------------------------------------------
// Send test notification email
// ---------------------------------------------------------------------------

export async function sendTestNotification(): Promise<ActionResult> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, error: "Failed to get user info" };
  }

  // Fetch user name
  const { data: users } = await insforgeClient
    .from("users")
    .select<Array<{ full_name: string; company_name: string }>>(
      token,
      `?id=eq.${authUser.id}&select=full_name,company_name`
    );

  const userName = users?.[0]?.full_name ?? "Test User";
  const company = users?.[0]?.company_name ?? "Test Company";
  const targetEmail = process.env.DANA_NOTIFICATION_EMAIL ?? "danat4lssplus@gmail.com";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#F5F7FA;font-family:'Montserrat',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F7FA;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background-color:#08376B;padding:24px 32px;text-align:center;">
              <h2 style="margin:0;color:#ffffff;font-size:20px;">Manager Elevator</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;text-align:center;">
              <h1 style="margin:0 0 16px;font-size:22px;color:#08376B;">Test Notification</h1>
              <p style="font-size:14px;line-height:1.6;color:#1C2733;">
                This is a test email from Manager Elevator. If you received this, email notifications are working correctly!
              </p>
              <table role="presentation" style="margin:24px auto;border-collapse:collapse;text-align:left;">
                <tr>
                  <td style="padding:8px 16px 8px 0;color:#6B7280;">Triggered by:</td>
                  <td style="padding:8px 0;font-weight:600;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 16px 8px 0;color:#6B7280;">Company:</td>
                  <td style="padding:8px 0;">${company}</td>
                </tr>
                <tr>
                  <td style="padding:8px 16px 8px 0;color:#6B7280;">Sent to:</td>
                  <td style="padding:8px 0;">${targetEmail}</td>
                </tr>
              </table>
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

  try {
    const { error } = await insforgeEmail.send({
      to: targetEmail,
      subject: "[Manager Elevator] Test Notification",
      html,
    });

    if (error) {
      console.error("[Test Email] Send failed:", error);
      return { success: false, error: `Email send failed: ${error}` };
    }

    return { success: true };
  } catch (err) {
    console.error("[Test Email] Unexpected error:", err);
    return { success: false, error: "Failed to send test email" };
  }
}
