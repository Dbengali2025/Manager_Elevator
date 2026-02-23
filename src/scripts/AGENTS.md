# src/scripts - Standalone Scripts

## ingest-book.ts
- Ingests "Bulletproof Your Manager Career" book into pgvector for RAG
- Run: `npx tsx --env-file=.env.local src/scripts/ingest-book.ts`
- Requires: `NEXT_PUBLIC_INSFORGE_URL` and `INSFORGE_API_KEY` in `.env.local`
- Parses 15 chapters across 5 parts, preserving chapter/section/page metadata
- Chunks text to ~500 tokens respecting paragraph boundaries with 50-token overlap
- Strips base64 images, markdown formatting, and anchor IDs before chunking
- Generates embeddings via Insforge OpenRouter (`openai/text-embedding-3-small`, 1536 dims)
- Stores chunks in `book_embeddings` table via Insforge REST API
- Uses direct `fetch()` calls (not `insforgeClient`) since it runs outside Next.js
- Rate limited: 1s pause every 10 chunks to avoid hitting API limits
- Book_embeddings table RLS: authenticated SELECT for all users, INSERT restricted to admin role
- Run once during initial setup — idempotent re-runs will create duplicate embeddings
