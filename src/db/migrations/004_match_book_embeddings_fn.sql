-- Migration 004: Add RPC function for semantic search on book_embeddings
-- This function is called via PostgREST RPC endpoint for RAG retrieval.

CREATE OR REPLACE FUNCTION match_book_embeddings(
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  chapter text,
  section text,
  page_range text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    be.id,
    be.chunk_text,
    be.chapter,
    be.section,
    be.page_range,
    1 - (be.embedding <=> query_embedding) AS similarity
  FROM book_embeddings be
  ORDER BY be.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
