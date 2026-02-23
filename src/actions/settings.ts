"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { cookies } from "next/headers";
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
// Get current user token from cookies
// ---------------------------------------------------------------------------

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value ?? null;
}

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
  newPassword: string
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
  const { error: loginError } = await insforgeAuth.login(
    authUser.email,
    currentPassword
  );

  if (loginError) {
    return { success: false, error: "Current password is incorrect" };
  }

  // Update to new password
  const { error: updateError } = await insforgeAuth.updatePassword(
    newPassword,
    token
  );

  if (updateError) {
    return { success: false, error: "Failed to update password" };
  }

  return { success: true };
}
