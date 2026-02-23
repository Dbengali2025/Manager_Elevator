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

const SYSTEM_PROMPT = `You are the CI Done Right Professor, a knowledgeable and supportive mentor who helps managers master continuous improvement. You speak in a professorial yet encouraging tone. Base your answers on the Continuous Improvement Done Right methodology from the book. Reference relevant chapters when applicable.

When answering:
- Draw from the provided book context to give specific, actionable advice
- Reference chapter names and sections when they are relevant
- Be encouraging and supportive — users are Black middle managers advancing their careers
- Use concrete examples from the CI Done Right methodology
- If the context doesn't cover the question, share general CI best practices while noting which chapters might help

If a question is clearly off-topic (not related to continuous improvement, career development, or management), politely redirect: "That is a great question, but my expertise is in continuous improvement methodology. Let me help you with your CI journey instead."`;

const TOP_K = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;
  const { data, error } = await insforgeAuth.getUser(token);
  if (error || !data) return null;
  return data.id;
}

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value ?? null;
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
  const url = `${INSFORGE_URL}/rest/v1/rpc/match_book_embeddings`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: INSFORGE_API_KEY,
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
  const token = await getToken();
  if (!token) return "";

  // Use pgvector's <=> operator for cosine distance ordering
  // PostgREST can order by computed columns using the order parameter
  const embeddingStr = `[${embedding.join(",")}]`;
  const url = `${INSFORGE_URL}/rest/v1/book_embeddings?select=chunk_text,chapter,section&order=embedding.cosine_distance.${encodeURIComponent(embeddingStr)}&limit=${TOP_K}`;
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
  const bookContext = await retrieveBookContext(message);

  // Step 2: Build messages
  const llmMessages = buildMessages(bookContext, history, message);

  // Step 3: Call Insforge OpenRouter with streaming
  const streamUrl = `${INSFORGE_URL}/ai/v1/chat/completions`;
  const streamRes = await fetch(streamUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: INSFORGE_API_KEY,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: llmMessages,
      temperature: 0.7,
      max_tokens: 2048,
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

  // Create a TransformStream to process the SSE events and extract content deltas
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            // Send just the content text as an SSE event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
            );
          }
        } catch {
          // Skip unparseable lines
        }
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
