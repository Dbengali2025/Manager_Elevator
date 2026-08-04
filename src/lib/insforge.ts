// Insforge BaaS client for Manager Elevator
// Provides REST API helpers and auth operations

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY ?? "";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Standard Insforge API response wrapper */
export interface InsforgeResponse<T = unknown> {
  data: T;
  error: string | null;
}

/** Error returned by Insforge API */
export interface InsforgeError {
  message: string;
  status: number;
}

/** Auth response returned on login/signup/verify (web client) */
export interface AuthResponse {
  user?: {
    id: string;
    email: string;
    emailVerified?: boolean;
    providers?: string[];
    createdAt?: string;
    updatedAt?: string;
    profile?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    role?: string;
  };
  accessToken: string | null;
  csrfToken?: string | null;
  refreshToken?: string | null;
  requireEmailVerification?: boolean;
  redirectTo?: string;
}

/** User record from the users table */
export interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  industry: string;
  role_title: string;
  onboarding_completed: boolean;
  ci_experience_level: string | null;
  miestro_linked: boolean;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

/** Generic row type for REST API queries */
export type Row = Record<string, unknown>;

// ---------------------------------------------------------------------------
// REST API Client
// ---------------------------------------------------------------------------

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  /** JWT token for authenticated requests */
  token?: string;
}

/**
 * Low-level fetch wrapper for Insforge REST API.
 * All table operations go through `/api/database/records/{table}`.
 */
async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<InsforgeResponse<T>> {
  const { method = "GET", body, headers = {}, token } = options;

  const url = `${INSFORGE_URL}${path}`;

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: INSFORGE_API_KEY,
    ...headers,
  };

  // A user token always wins. Failing that, AI and auth endpoints still need an
  // Authorization header -- the gateway rejects them with "No token provided"
  // when only `apikey` is sent, which breaks signup and login.
  //
  // Deliberately NOT applied to /api/database/: the service key belongs to
  // project_admin, which has BYPASSRLS, so falling back to it there would
  // silently defeat row-level security on any query that forgot its token.
  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  } else if (path.startsWith("/api/ai/") || path.startsWith("/api/auth/")) {
    reqHeaders["Authorization"] = `Bearer ${INSFORGE_API_KEY}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return {
        data: null as T,
        error: errorBody || `HTTP ${res.status}`,
      };
    }

    // Some responses (e.g. DELETE 204) may have no body
    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : (null as T);

    return { data, error: null };
  } catch (err) {
    return {
      data: null as T,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Insforge REST client for database table operations.
 *
 * Usage:
 *   const { data, error } = await insforgeClient.from("users").select(token);
 *   const { data, error } = await insforgeClient.from("users").insert({ ... }, token);
 */
export const insforgeClient = {
  from(table: string) {
    const basePath = `/api/database/records/${table}`;

    return {
      /** SELECT rows. Pass query params for filtering (e.g. "?id=eq.abc") */
      async select<T = Row[]>(
        token: string,
        query = ""
      ): Promise<InsforgeResponse<T>> {
        return request<T>(`${basePath}${query}`, {
          token,
        });
      },

      /** INSERT a row. Body is wrapped in an array per Insforge API requirement. */
      async insert<T = Row>(
        data: Record<string, unknown>,
        token: string
      ): Promise<InsforgeResponse<T>> {
        return request<T>(basePath, {
          method: "POST",
          body: [data],
          token,
          headers: { Prefer: "return=representation" },
        });
      },

      /** UPDATE rows matching query */
      async update<T = Row>(
        data: Record<string, unknown>,
        token: string,
        query = ""
      ): Promise<InsforgeResponse<T>> {
        return request<T>(`${basePath}${query}`, {
          method: "PATCH",
          body: data,
          token,
          headers: { Prefer: "return=representation" },
        });
      },

      /** DELETE rows matching query */
      async delete(
        token: string,
        query = ""
      ): Promise<InsforgeResponse<null>> {
        return request<null>(`${basePath}${query}`, {
          method: "DELETE",
          token,
        });
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Auth Client
// ---------------------------------------------------------------------------

/**
 * Insforge Auth helpers for signup, login, password reset, and token refresh.
 * Uses the correct Insforge REST API paths (/api/auth/...).
 */
export const insforgeAuth = {
  /** Register a new user with email + password (mobile client_type for direct refresh token) */
  async signup(
    email: string,
    password: string,
    name?: string
  ): Promise<InsforgeResponse<AuthResponse>> {
    return request<AuthResponse>("/api/auth/users?client_type=mobile", {
      method: "POST",
      body: { email, password, ...(name ? { name } : {}) },
    });
  },

  /** Login with email + password (mobile client_type for direct refresh token) */
  async login(
    email: string,
    password: string
  ): Promise<InsforgeResponse<AuthResponse>> {
    return request<AuthResponse>("/api/auth/sessions?client_type=mobile", {
      method: "POST",
      body: { email, password },
    });
  },

  /** Refresh an expired access token using refresh token */
  async refreshToken(
    refreshToken: string
  ): Promise<InsforgeResponse<AuthResponse>> {
    return request<AuthResponse>("/api/auth/refresh?client_type=mobile", {
      method: "POST",
      body: { refresh_token: refreshToken },
    });
  },

  /** Get the current user from an access token. Unwraps the nested { user } envelope. */
  async getUser(token: string): Promise<InsforgeResponse<{ id: string; email: string; role: string }>> {
    const result = await request<{ user: { id: string; email: string; role: string } }>("/api/auth/sessions/current", { token });
    if (result.error || !result.data?.user) {
      return { data: null as unknown as { id: string; email: string; role: string }, error: result.error || "No user data" };
    }
    return { data: result.data.user, error: null };
  },

  /** Get a user's profile by ID */
  async getProfile(userId: string): Promise<InsforgeResponse<{ id: string; name?: string; avatar_url?: string }>> {
    return request<{ id: string; name?: string; avatar_url?: string }>(`/api/auth/profiles/${userId}`);
  },

  /** Request a password reset email */
  async resetPassword(email: string): Promise<InsforgeResponse<{ success: boolean; message: string }>> {
    return request<{ success: boolean; message: string }>("/api/auth/email/send-reset-password", {
      method: "POST",
      body: { email },
    });
  },

  /** Exchange a reset password code for a token */
  async exchangeResetPasswordToken(
    email: string,
    code: string
  ): Promise<InsforgeResponse<{ token: string; expiresAt: string }>> {
    return request<{ token: string; expiresAt: string }>("/api/auth/email/exchange-reset-password-token", {
      method: "POST",
      body: { email, code },
    });
  },

  /** Reset password with a token/otp */
  async resetPasswordWithToken(
    newPassword: string,
    otp: string
  ): Promise<InsforgeResponse<{ message: string }>> {
    return request<{ message: string }>("/api/auth/email/reset-password", {
      method: "POST",
      body: { newPassword, otp },
    });
  },

  /** Verify email with OTP code (mobile client_type for direct refresh token) */
  async verifyOtp(
    email: string,
    otp: string
  ): Promise<InsforgeResponse<AuthResponse>> {
    return request<AuthResponse>("/api/auth/email/verify?client_type=mobile", {
      method: "POST",
      body: { email, otp },
    });
  },

  /** Update current user's profile */
  async updateProfile(
    profile: Record<string, unknown>,
    token: string
  ): Promise<InsforgeResponse<{ id: string; profile: Record<string, unknown> }>> {
    return request<{ id: string; profile: Record<string, unknown> }>("/api/auth/profiles/current", {
      method: "PATCH",
      body: { profile },
      token,
    });
  },
};

// ---------------------------------------------------------------------------
// AI / OpenRouter Client
// ---------------------------------------------------------------------------

/**
 * Insforge OpenRouter helpers for AI chat completions (GPT-4o).
 */
export const insforgeAI = {
  /** Send a chat completion request via Insforge AI */
  async chatCompletion(params: {
    model?: string;
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<
    InsforgeResponse<{
      text: string;
      metadata?: { model: string; usage: Record<string, number> };
    }>
  > {
    return request("/api/ai/chat/completion", {
      method: "POST",
      body: {
        model: params.model ?? "anthropic/claude-sonnet-4.6",
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        maxTokens: params.maxTokens ?? 2048,
      },
    });
  },
};

// ---------------------------------------------------------------------------
// Embeddings Client
// ---------------------------------------------------------------------------

/**
 * Insforge OpenRouter helpers for generating text embeddings.
 */
export const insforgeEmbeddings = {
  /** Generate an embedding vector for the given text */
  async create(params: {
    input: string;
    model?: string;
  }): Promise<
    InsforgeResponse<{
      data: { embedding: number[]; index: number }[];
    }>
  > {
    return request("/api/ai/embeddings", {
      method: "POST",
      body: {
        model: params.model ?? "openai/text-embedding-3-small",
        input: params.input,
      },
    });
  },
};

// ---------------------------------------------------------------------------
// Email Client (Resend)
// ---------------------------------------------------------------------------

import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "");
}

const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Manager Elevator <onboarding@resend.dev>";

/**
 * Email helpers using Resend for transactional emails.
 */
export const insforgeEmail = {
  /** Send an email via Resend */
  async send(params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
  }): Promise<InsforgeResponse<{ message_id: string }>> {
    try {
      const { data, error } = await getResend().emails.send({
        from: params.from ?? EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { replyTo: params.replyTo } : {}),
      });

      if (error) {
        return {
          data: null as unknown as { message_id: string },
          error: error.message,
        };
      }

      return {
        data: { message_id: data?.id ?? "" },
        error: null,
      };
    } catch (err) {
      return {
        data: null as unknown as { message_id: string },
        error: err instanceof Error ? err.message : "Unknown email error",
      };
    }
  },
};
