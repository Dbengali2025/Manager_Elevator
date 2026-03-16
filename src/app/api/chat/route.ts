import { cookies } from "next/headers";
import {
  insforgeAuth,
  insforgeEmbeddings,
} from "@/lib/insforge";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY ?? "";

const SYSTEM_PROMPT = `You are the CI Done Right Professor, a knowledgeable and supportive mentor who helps managers master continuous improvement. You speak in a professorial yet encouraging tone.

CRITICAL RULES:
- You MUST ONLY use information from the BOOK CONTEXT provided below to answer questions. Do NOT use any external knowledge, web searches, or outside sources.
- NEVER include URLs or links to external websites in your answers.
- If the provided book context contains relevant information, use it to give specific, actionable advice.
- If the book context does NOT cover the question, say: "That's a great question! While the CI Done Right methodology doesn't cover that specific topic in the excerpts I have available, I encourage you to explore the full book for more insights. Is there another CI topic I can help you with?"
- Reference chapter names and sections from the book context when they are relevant.
- Be encouraging and supportive — users are Black middle managers advancing their careers.
- Use concrete examples from the CI Done Right methodology as found in the provided context.
- Do NOT make up or fabricate information that is not in the provided book context.

If a question is clearly off-topic (not related to continuous improvement, career development, or management), politely redirect: "That's a great question, but my expertise is in the CI Done Right methodology. Let me help you with your CI journey instead."`;

const TOP_K = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get a valid token for this request. Tries access_token first, then refreshes
 * via refresh_token. Attempts to persist new tokens to cookies.
 */
async function getTokenForRequest(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (accessToken) {
    const { error } = await insforgeAuth.getUser(accessToken);
    if (!error) return accessToken;
    console.log("[chat/route] Access token expired or invalid, attempting refresh...");
  } else {
    console.log("[chat/route] No access_token cookie found");
  }

  // Try refresh
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!refreshToken) {
    console.log("[chat/route] No refresh_token cookie found — user not authenticated");
    return null;
  }

  const { data, error } = await insforgeAuth.refreshToken(refreshToken);
  if (error || !data?.accessToken) {
    console.log("[chat/route] Refresh token failed:", error);
    return null;
  }

  console.log("[chat/route] Token refreshed successfully");

  // Try to persist the new tokens
  try {
    cookieStore.set("access_token", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
    if (data.refreshToken) {
      cookieStore.set("refresh_token", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  } catch {
    // Cookie setting may fail in streaming context — token still valid for this request
  }

  return data.accessToken;
}

async function getAuthUserId(): Promise<string | null> {
  const token = await getTokenForRequest();
  if (!token) return null;
  const { data, error } = await insforgeAuth.getUser(token);
  if (error || !data) return null;
  return data.id;
}

/** Embed user question and retrieve top-K similar book chunks from pgvector */
async function retrieveBookContext(question: string): Promise<string> {
  // Generate embedding for the user's question
  const embedResult = await insforgeEmbeddings.create({ input: question });
  if (embedResult.error || !embedResult.data?.data?.[0]?.embedding) {
    console.error("Failed to embed question:", embedResult.error);
    return "";
  }

  const questionEmbedding = embedResult.data.data[0].embedding;

  // Query pgvector for top-K similar chunks using Insforge RPC
  // We use a direct SQL function call via the REST API
  const url = `${INSFORGE_URL}/api/database/rpc/match_book_embeddings`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: INSFORGE_API_KEY,
      Authorization: `Bearer ${INSFORGE_API_KEY}`,
    },
    body: JSON.stringify({
      query_embedding: questionEmbedding,
      match_count: TOP_K,
    }),
  });

  if (!res.ok) {
    // Fallback: try direct table query with ordering by similarity
    // This works if there's no RPC function — do a basic select and let client sort
    console.error(
      "RPC match_book_embeddings not available, falling back to direct query"
    );
    return await retrieveBookContextFallback(questionEmbedding);
  }

  const chunks: { chunk_text: string; chapter: string; section: string; similarity: number }[] =
    await res.json();

  if (!chunks || chunks.length === 0) return "";

  return chunks
    .map(
      (c, i) =>
        `[Source ${i + 1} — ${c.chapter}${c.section ? `, ${c.section}` : ""}]\n${c.chunk_text}`
    )
    .join("\n\n---\n\n");
}

/** Fallback: select chunks and do cosine similarity via pgvector operator */
async function retrieveBookContextFallback(
  embedding: number[]
): Promise<string> {
  const token = await getTokenForRequest();
  if (!token) return "";

  // Use pgvector's <=> operator for cosine distance ordering
  // PostgREST can order by computed columns using the order parameter
  const embeddingStr = `[${embedding.join(",")}]`;
  const url = `${INSFORGE_URL}/api/database/records/book_embeddings?select=chunk_text,chapter,section&order=embedding.cosine_distance.${encodeURIComponent(embeddingStr)}&limit=${TOP_K}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: INSFORGE_API_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error("Fallback pgvector query failed:", await res.text());
    return "";
  }

  const chunks: { chunk_text: string; chapter: string; section: string }[] =
    await res.json();

  if (!chunks || chunks.length === 0) return "";

  return chunks
    .map(
      (c, i) =>
        `[Source ${i + 1} — ${c.chapter}${c.section ? `, ${c.section}` : ""}]\n${c.chunk_text}`
    )
    .join("\n\n---\n\n");
}

/** Build the messages array for the LLM, including book context */
function buildMessages(
  bookContext: string,
  conversationMessages: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): { role: "system" | "user" | "assistant"; content: string }[] {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];

  // System prompt with book context
  let systemContent = SYSTEM_PROMPT;
  if (bookContext) {
    systemContent += `\n\n--- BOOK CONTEXT ---\nUse the following excerpts from "Bulletproof Your Manager Career" to inform your response:\n\n${bookContext}\n--- END BOOK CONTEXT ---`;
  }
  messages.push({ role: "system", content: systemContent });

  // Include recent conversation history (last 10 messages for context window management)
  const recentHistory = conversationMessages.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add the current user message
  messages.push({ role: "user", content: userMessage });

  return messages;
}

// ---------------------------------------------------------------------------
// POST handler — streaming chat response
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  // Authenticate
  const userId = await getAuthUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const {
    message,
    history = [],
  }: {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
  } = body;

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 1: Retrieve book context via RAG
  console.log("[chat/route] Retrieving book context for:", message.substring(0, 50));
  const bookContext = await retrieveBookContext(message);
  console.log("[chat/route] Book context length:", bookContext.length, "chars");

  // Step 2: Build messages
  const llmMessages = buildMessages(bookContext, history, message);
  console.log("[chat/route] Sending", llmMessages.length, "messages to AI");

  // Step 3: Call Insforge AI chat completion with streaming
  const streamUrl = `${INSFORGE_URL}/api/ai/chat/completion`;
  const streamRes = await fetch(streamUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${INSFORGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4.6",
      messages: llmMessages,
      temperature: 0.7,
      maxTokens: 2048,
      stream: true,
    }),
  });

  if (!streamRes.ok) {
    const errText = await streamRes.text();
    console.error("AI streaming request failed:", errText);
    return new Response(
      JSON.stringify({ error: "Failed to get AI response" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // If the response is already a stream (SSE), pipe it through
  if (!streamRes.body) {
    return new Response(
      JSON.stringify({ error: "No response stream available" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create a TransformStream to process Insforge SSE events and extract content chunks
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let sentDone = false;
  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data) continue;

        try {
          const parsed = JSON.parse(data);

          // Insforge streams: {"chunk": "text"} for content, {"done": true} for end
          if (parsed.done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            sentDone = true;
            return;
          }
          if (parsed.chunk) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: parsed.chunk })}\n\n`)
            );
          }
          // Ignore tokenUsage and annotations events
        } catch {
          // Skip unparseable lines
        }
      }
    },
    flush(controller) {
      if (!sentDone) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }
    },
  });

  const readableStream = streamRes.body.pipeThrough(transformStream);

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
