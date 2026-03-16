"use server";

import { insforgeAuth, insforgeClient } from "@/lib/insforge";
import { cookies } from "next/headers";
import { notifyNewUserRegistered } from "@/actions/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignupInput {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  industry: string;
  roleTitle: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------

export async function signupAction(input: SignupInput): Promise<ActionResult> {
  const { email, password, fullName, companyName, industry, roleTitle } = input;

  // Call Insforge Auth signup
  const { data, error } = await insforgeAuth.signup(email, password, fullName);

  if (error) {
    // Check for duplicate email
    if (error.includes("already") || error.includes("USER_EXISTS")) {
      return { success: false, error: "An account with this email already exists" };
    }
    return { success: false, error: error };
  }

  if (!data) {
    return { success: false, error: "Signup failed. Please try again." };
  }

  // If email verification is required, we may not have a token yet
  const token = data.accessToken;

  if (token) {
    // Create user record in the users table
    const { error: insertError } = await insforgeClient.from("users").insert(
      {
        id: data.user?.id,
        email,
        full_name: fullName,
        company_name: companyName,
        industry,
        role_title: roleTitle,
        onboarding_completed: false,
        ci_experience_level: null,
        miestro_linked: false,
        role: "user",
      },
      token
    );

    if (insertError) {
      console.error("Failed to create user profile:", insertError);
      // Don't fail signup — the auth account exists, profile can be created later
    }
  }

  // Fire-and-forget: notify Dana of new user registration
  notifyNewUserRegistered({
    fullName,
    email,
    company: companyName,
    industry,
    roleTitle,
  }).catch((err) => console.error("Notification error:", err));

  return { success: true };
}

// ---------------------------------------------------------------------------
// Verify OTP (email verification)
// ---------------------------------------------------------------------------

export async function verifyOtpAction(
  email: string,
  code: string,
  signupData?: {
    fullName: string;
    companyName: string;
    industry: string;
    roleTitle: string;
  }
): Promise<ActionResult> {
  const { data, error } = await insforgeAuth.verifyOtp(email, code);

  if (error) {
    return { success: false, error: "Invalid verification code. Please try again." };
  }

  if (!data || !data.accessToken) {
    return { success: false, error: "Verification failed. Please try again." };
  }

  // Set auth cookies
  const cookieStore = await cookies();

  cookieStore.set("access_token", data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  if (data.refreshToken) {
    cookieStore.set("refresh_token", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  // Create user record in app's users table if it doesn't exist yet
  if (data.user?.id) {
    const userId = data.user.id;
    const { data: existing } = await insforgeClient
      .from("users")
      .select<Array<{ id: string }>>(data.accessToken, `?id=eq.${userId}&select=id`);

    if (!existing || existing.length === 0) {
      // Use signup form data if available, otherwise fall back to auth profile
      let fullName = signupData?.fullName ?? "";
      if (!fullName) {
        const { data: profile } = await insforgeAuth.getProfile(userId);
        fullName = profile?.name ?? "";
      }

      await insforgeClient.from("users").insert(
        {
          id: userId,
          email,
          full_name: fullName,
          company_name: signupData?.companyName ?? "",
          industry: signupData?.industry ?? "",
          role_title: signupData?.roleTitle ?? "",
          onboarding_completed: false,
          ci_experience_level: null,
          miestro_linked: false,
          role: "user",
        },
        data.accessToken
      );
    }
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function loginAction(
  email: string,
  password: string
): Promise<ActionResult> {
  const { data, error } = await insforgeAuth.login(email, password);

  if (error) {
    if (error.includes("EMAIL_NOT_VERIFIED")) {
      return { success: false, error: "Please verify your email before signing in." };
    }
    return { success: false, error: "Invalid email or password." };
  }

  if (!data || !data.accessToken) {
    return { success: false, error: "Login failed. Please try again." };
  }

  // Set auth cookies
  const cookieStore = await cookies();

  cookieStore.set("access_token", data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  if (data.refreshToken) {
    cookieStore.set("refresh_token", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  // Ensure user record exists in app's users table
  if (data.user?.id) {
    const userId = data.user.id;
    const { data: existing } = await insforgeClient
      .from("users")
      .select<Array<{ id: string }>>(data.accessToken, `?id=eq.${userId}&select=id`);

    if (!existing || existing.length === 0) {
      const { data: profile } = await insforgeAuth.getProfile(userId);
      await insforgeClient.from("users").insert(
        {
          id: userId,
          email,
          full_name: profile?.name ?? "",
          company_name: "",
          industry: "",
          role_title: "",
          onboarding_completed: false,
          ci_experience_level: null,
          miestro_linked: false,
          role: "user",
        },
        data.accessToken
      );
    }
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Request password reset
// ---------------------------------------------------------------------------

export async function requestPasswordResetAction(
  email: string
): Promise<ActionResult> {
  const { error } = await insforgeAuth.resetPassword(email);

  if (error) {
    // Don't reveal whether the email exists
    console.error("Password reset error:", error);
  }

  // Always return success to prevent email enumeration
  return { success: true };
}

// ---------------------------------------------------------------------------
// Confirm password reset (verify code + set new password)
// ---------------------------------------------------------------------------

export async function confirmPasswordResetAction(
  email: string,
  code: string,
  newPassword: string
): Promise<ActionResult> {
  // Step 1: Exchange the reset code for a token
  const { data, error } = await insforgeAuth.exchangeResetPasswordToken(email, code);

  if (error || !data) {
    return { success: false, error: "Invalid or expired reset code. Please try again." };
  }

  // Step 2: Use the token to reset the password
  const { error: resetError } = await insforgeAuth.resetPasswordWithToken(
    newPassword,
    data.token
  );

  if (resetError) {
    return { success: false, error: "Failed to update password. Please try again." };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logoutAction(): Promise<ActionResult> {
  const cookieStore = await cookies();

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("csrf_token");

  return { success: true };
}
