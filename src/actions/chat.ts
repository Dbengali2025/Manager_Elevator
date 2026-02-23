"use server";

import { insforgeClient, insforgeAuth } from "@/lib/insforge";
import { cookies } from "next/headers";
import type { Conversation, Message } from "@/db/types";

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
// Get conversations list
// ---------------------------------------------------------------------------

export async function getConversations(): Promise<{
  success: boolean;
  error?: string;
  data?: Conversation[];
}> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  const { data, error } = await insforgeClient
    .from("conversations")
    .select<Conversation[]>(
      token,
      `?user_id=eq.${userId}&order=created_at.desc`
    );

  if (error) return { success: false, error };
  return { success: true, data: data ?? [] };
}

// ---------------------------------------------------------------------------
// Get messages for a conversation
// ---------------------------------------------------------------------------

export async function getMessages(conversationId: string): Promise<{
  success: boolean;
  error?: string;
  data?: Message[];
}> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const { data, error } = await insforgeClient
    .from("messages")
    .select<Message[]>(
      token,
      `?conversation_id=eq.${conversationId}&order=created_at.asc`
    );

  if (error) return { success: false, error };
  return { success: true, data: data ?? [] };
}

// ---------------------------------------------------------------------------
// Create a new conversation
// ---------------------------------------------------------------------------

export async function createConversation(title: string): Promise<{
  success: boolean;
  error?: string;
  data?: Conversation;
}> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const userId = await getUserId(token);
  if (!userId) return { success: false, error: "Failed to get user info" };

  const { data, error } = await insforgeClient
    .from("conversations")
    .insert<Conversation[]>(
      { user_id: userId, title },
      token
    );

  if (error) return { success: false, error };

  const conversation = Array.isArray(data) ? data[0] : data;
  return { success: true, data: conversation as Conversation };
}

// ---------------------------------------------------------------------------
// Send a message (user or assistant)
// ---------------------------------------------------------------------------

export async function sendMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<{
  success: boolean;
  error?: string;
  data?: Message;
}> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const { data, error } = await insforgeClient
    .from("messages")
    .insert<Message[]>(
      { conversation_id: conversationId, role, content },
      token
    );

  if (error) return { success: false, error };

  const message = Array.isArray(data) ? data[0] : data;
  return { success: true, data: message as Message };
}

// ---------------------------------------------------------------------------
// Update conversation title
// ---------------------------------------------------------------------------

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const { error } = await insforgeClient
    .from("conversations")
    .update({ title }, token, `?id=eq.${conversationId}`);

  if (error) return { success: false, error };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Delete a conversation (and cascade messages)
// ---------------------------------------------------------------------------

export async function deleteConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  const { error } = await insforgeClient
    .from("conversations")
    .delete(token, `?id=eq.${conversationId}`);

  if (error) return { success: false, error };
  return { success: true };
}
