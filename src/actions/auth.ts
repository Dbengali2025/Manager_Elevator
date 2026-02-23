"use server";

import { insforgeAuth, insforgeClient } from "@/lib/insforge";
import { cookies } from "next/headers";

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
  const { data, error } = await insforgeAuth.signup(email, password);

  if (error) {
    // Check for duplicate email
    if (error.includes("already registered") || error.includes("already exists")) {
      return { success: false, error: "An account with this email already exists" };
    }
    return { success: false, error: error };
  }

  if (!data) {
    return { success: false, error: "Signup failed. Please try again." };
  }

  // Store the access token temporarily to create the user profile
  // After signup, we have a token we can use to insert the user record
  const token = data.access_token;

  // Create user record in the users table
  const { error: insertError } = await insforgeClient.from("users").insert(
    {
      id: data.access_token ? undefined : undefined, // Let the auth system set the id
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

  return { success: true };
}

// ---------------------------------------------------------------------------
// Verify OTP (email verification)
// ---------------------------------------------------------------------------

export async function verifyOtpAction(
  email: string,
  code: string
): Promise<ActionResult> {
  const { data, error } = await insforgeAuth.verifyOtp(email, code, "signup");

  if (error) {
    return { success: false, error: "Invalid verification code. Please try again." };
  }

  if (!data) {
    return { success: false, error: "Verification failed. Please try again." };
  }

  // Set auth cookies
  const cookieStore = await cookies();

  cookieStore.set("access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: data.expires_in,
  });

  cookieStore.set("refresh_token", data.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return { success: true };
}
