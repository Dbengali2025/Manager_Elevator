# API Chat Route - Agent Guidelines

## Overview
POST endpoint at `/api/chat` for streaming AI chat responses with RAG-retrieved book context.

## RAG Pipeline Flow
1. **Authenticate** — reads `access_token` cookie, validates via `insforgeAuth.getUser()`
2. **Embed question** — calls `insforgeEmbeddings.create({ input })` to get 1536-dim vector
3. **Retrieve context** — queries pgvector via RPC `match_book_embeddings` for top-5 similar book chunks
4. **Build messages** — system prompt (CI Professor personality) + book context + last 10 conversation messages + user question
5. **Stream response** — calls Insforge OpenRouter `/ai/v1/chat/completions` with `stream: true`, pipes SSE through TransformStream

## Request Body
```json
{
  "message": "user question text",
  "history": [{ "role": "user|assistant", "content": "..." }]
}
```

## Response
- SSE stream: `data: {"content": "token text"}\n\n`
- Terminal event: `data: [DONE]\n\n`
- Error responses: JSON with `{ error: string }` and appropriate HTTP status

## Key Implementation Details
- `retrieveBookContext()` tries RPC first, falls back to direct pgvector query
- `buildMessages()` includes system prompt with book context injected between delimiters
- TransformStream extracts `choices[0].delta.content` from OpenAI-compatible SSE chunks
- Auth check uses `insforgeAuth.getUser()` — not the REST client (different auth pattern)
- AI and embeddings calls use API key only (no JWT token needed)
- Conversation history limited to last 10 messages to manage context window

## Migration
- `004_match_book_embeddings_fn.sql` — creates `match_book_embeddings(query_embedding, match_count)` RPC function
- Uses `1 - (embedding <=> query_embedding)` for cosine similarity score
- Must be run in Insforge admin panel before first use

## Gotchas
- `cookies()` must be awaited in Next.js 14 Route Handlers (same as server actions)
- SSE chunks may split across multiple `data:` lines — use buffer pattern for reliable parsing
- If RPC function doesn't exist yet, fallback query is attempted but may not work with all PostgREST versions
