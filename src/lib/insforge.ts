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

/** Auth token pair returned on login/signup */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
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
 * All table operations go through `/rest/v1/{table}`.
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

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
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
    const basePath = `/rest/v1/${table}`;

    return {
      /** SELECT rows. Pass query params for filtering (e.g. "?id=eq.abc") */
      async select<T = Row[]>(
        token: string,
        query = ""
      ): Promise<InsforgeResponse<T>> {
        return request<T>(`${basePath}${query}`, {
          token,
          headers: { Prefer: "return=representation" },
        });
      },

      /** INSERT a row */
      async insert<T = Row>(
        data: Record<string, unknown>,
        token: string
      ): Promise<InsforgeResponse<T>> {
        return request<T>(basePath, {
          method: "POST",
          body: data,
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
 */
export const insforgeAuth = {
  /** Register a new user with email + password */
  async signup(
    email: string,
    password: string
  ): Promise<InsforgeResponse<AuthTokens>> {
    return request<AuthTokens>("/auth/v1/signup", {
      method: "POST",
      body: { email, password },
    });
  },

  /** Login with email + password */
  async login(
    email: string,
    password: string
  ): Promise<InsforgeResponse<AuthTokens>> {
    return request<AuthTokens>("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password },
    });
  },

  /** Refresh an expired access token */
  async refreshToken(
    refreshToken: string
  ): Promise<InsforgeResponse<AuthTokens>> {
    return request<AuthTokens>("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: { refresh_token: refreshToken },
    });
  },

  /** Get the current user profile from an access token */
  async getUser(token: string): Promise<InsforgeResponse<UserRecord>> {
    return request<UserRecord>("/auth/v1/user", { token });
  },

  /** Request a password reset email */
  async resetPassword(email: string): Promise<InsforgeResponse<null>> {
    return request<null>("/auth/v1/recover", {
      method: "POST",
      body: { email },
    });
  },

  /** Update password (requires valid access token) */
  async updatePassword(
    newPassword: string,
    token: string
  ): Promise<InsforgeResponse<UserRecord>> {
    return request<UserRecord>("/auth/v1/user", {
      method: "PATCH",
      body: { password: newPassword },
      token,
    });
  },

  /** Verify OTP code (email verification) */
  async verifyOtp(
    email: string,
    token: string,
    type: "signup" | "recovery" = "signup"
  ): Promise<InsforgeResponse<AuthTokens>> {
    return request<AuthTokens>("/auth/v1/verify", {
      method: "POST",
      body: { email, token, type },
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
  /** Send a chat completion request via Insforge OpenRouter */
  async chatCompletion(params: {
    model?: string;
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    temperature?: number;
    max_tokens?: number;
  }): Promise<
    InsforgeResponse<{
      choices: { message: { role: string; content: string } }[];
    }>
  > {
    return request("/ai/v1/chat/completions", {
      method: "POST",
      body: {
        model: params.model ?? "openai/gpt-4o",
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens ?? 2048,
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
    return request("/ai/v1/embeddings", {
      method: "POST",
      body: {
        model: params.model ?? "openai/text-embedding-3-small",
        input: params.input,
      },
    });
  },
};

// ---------------------------------------------------------------------------
// Email Client
// ---------------------------------------------------------------------------

/**
 * Insforge Email (AWS SES) helpers for sending transactional emails.
 */
export const insforgeEmail = {
  /** Send an email via Insforge Email (AWS SES) */
  async send(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<InsforgeResponse<{ message_id: string }>> {
    return request<{ message_id: string }>("/email/v1/send", {
      method: "POST",
      body: params,
    });
  },
};
