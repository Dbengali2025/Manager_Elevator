"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { cookies } from "next/headers";
import type { UserProgress } from "@/db/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardData {
  userName: string;
  progressRecords: UserProgress[];
}

// ---------------------------------------------------------------------------
// Get current user token from cookies
// ---------------------------------------------------------------------------

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value ?? null;
}

// ---------------------------------------------------------------------------
// Get dashboard data (user info + progress records)
// ---------------------------------------------------------------------------

export async function getDashboardData(): Promise<{
  success: boolean;
  error?: string;
  data?: DashboardData;
}> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: authUser, error: authError } = await insforgeAuth.getUser(token);
  if (authError || !authUser) {
    return { success: false, error: "Failed to get user info" };
  }

  // Fetch user name
  const { data: users, error: userError } = await insforgeClient
    .from("users")
    .select<Array<{ full_name: string }>>(
      token,
      `?id=eq.${authUser.id}&select=full_name`
    );

  if (userError || !users || users.length === 0) {
    return { success: false, error: "User profile not found" };
  }

  // Fetch all progress records
  const { data: progress, error: progressError } = await insforgeClient
    .from("user_progress")
    .select<UserProgress[]>(
      token,
      `?user_id=eq.${authUser.id}&order=created_at.asc`
    );

  if (progressError) {
    console.error("Failed to fetch progress:", progressError);
  }

  return {
    success: true,
    data: {
      userName: users[0].full_name,
      progressRecords: progress ?? [],
    },
  };
}
