"use server";

import { cookies } from "next/headers";
import { insforgeAuth } from "@/lib/insforge";

/**
 * Get a valid access token, automatically refreshing if expired.
 * Returns null if no token is available and refresh fails.
 */
export async function getValidToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (accessToken) {
      // Quick check if token still works
      const { error } = await insforgeAuth.getUser(accessToken);
      if (!error) {
        return accessToken;
      }
      console.log("[auth-helpers] access_token exists but is invalid/expired, attempting refresh...");
    } else {
      console.log("[auth-helpers] No access_token cookie found, attempting refresh...");
    }

    // Token missing or expired — try to refresh using refresh_token
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (!refreshToken) {
      console.log("[auth-helpers] No refresh_token cookie — user must re-login");
      return null;
    }

    console.log("[auth-helpers] Refreshing with refresh_token...");
    const { data, error } = await insforgeAuth.refreshToken(refreshToken);
    if (error || !data?.accessToken) {
      console.error("[auth-helpers] Refresh failed:", error ?? "No accessToken returned");
      return null;
    }

    console.log("[auth-helpers] Refresh succeeded, saving new tokens");

    // Persist the new tokens
    try {
      cookieStore.set("access_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });

      // Token rotation: store the new refresh token
      if (data.refreshToken) {
        cookieStore.set("refresh_token", data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    } catch (cookieErr) {
      console.warn("[auth-helpers] Could not persist refreshed tokens to cookies:", cookieErr);
    }

    return data.accessToken;
  } catch (err) {
    console.error("[auth-helpers] Unexpected error in getValidToken:", err);
    return null;
  }
}
