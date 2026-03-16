/**
 * Book Ingestion Script for Manager Elevator RAG
 *
 * Reads "Bulletproof Your Manager Career" markdown file, splits into chunks
 * of ~500 tokens respecting chapter/section boundaries, generates embeddings
 * via Insforge OpenRouter, and stores in the book_embeddings table (pgvector).
 *
 * Usage: npx tsx --env-file=.env.local src/scripts/ingest-book.ts
 *
 * Environment variables required (from .env.local):
 *   NEXT_PUBLIC_INSFORGE_URL      - Insforge API base URL
 *   INSFORGE_API_KEY              - Insforge API key (server-side admin)
 *   NEXT_PUBLIC_INSFORGE_ANON_KEY - Insforge anon JWT key
 */

import * as fs from "fs";
import * as path from "path";

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY ?? "";
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? "";

if (!INSFORGE_URL || !INSFORGE_API_KEY) {
  console.error(
    "ERROR: Missing NEXT_PUBLIC_INSFORGE_URL or INSFORGE_API_KEY in .env.local"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Book structure definitions
// ---------------------------------------------------------------------------

interface BookChapter {
  part: string;
  partTitle: string;
  chapter: string;
  chapterTitle: string;
  startLine: number;
}

interface BookChunk {
  chunkText: string;
  chapter: string;
  section: string;
  pageRange: string;
}

// Book structure: Part → Chapters mapping with approximate page ranges
// 120 pages total, 15 chapters, ~8 pages per chapter on average
const BOOK_STRUCTURE: {
  part: string;
  title: string;
  chapters: { num: number; pages: string }[];
}[] = [
  {
    part: "Part I",
    title: "The Problem – Middle Managers Feel Undervalued",
    chapters: [
      { num: 1, pages: "1-12" },
      { num: 2, pages: "13-22" },
      { num: 3, pages: "23-32" },
    ],
  },
  {
    part: "Part II",
    title:
      "The Solution – Becoming More Valuable. Become A Workplace Waste Warrior",
    chapters: [
      { num: 4, pages: "33-40" },
      { num: 5, pages: "41-52" },
    ],
  },
  {
    part: "Part III",
    title:
      "Becoming A Most Valuable Workplace Waste Identifier – Identifying Workplace Waste",
    chapters: [
      { num: 6, pages: "53-58" },
      { num: 7, pages: "59-72" },
      { num: 8, pages: "73-78" },
    ],
  },
  {
    part: "Part IV",
    title:
      "Becoming A Most Valuable Workplace Waste Eliminator – Eliminating Workplace Waste",
    chapters: [
      { num: 9, pages: "79-84" },
      { num: 10, pages: "85-96" },
      { num: 11, pages: "97-106" },
      { num: 12, pages: "107-114" },
    ],
  },
  {
    part: "Part V",
    title:
      "Becoming A Most Valuable Workplace Waste Terminator – Sustained Manager Career Success",
    chapters: [
      { num: 13, pages: "115-122" },
      { num: 14, pages: "123-138" },
      { num: 15, pages: "139-146" },
    ],
  },
];

// Flatten to chapter → page range lookup
const CHAPTER_PAGES: Record<number, string> = {};
for (const part of BOOK_STRUCTURE) {
  for (const ch of part.chapters) {
    CHAPTER_PAGES[ch.num] = ch.pages;
  }
}

// Chapter → Part lookup
function getPartForChapter(chapterNum: number): {
  part: string;
  title: string;
} {
  for (const part of BOOK_STRUCTURE) {
    if (part.chapters.some((ch) => ch.num === chapterNum)) {
      return { part: part.part, title: part.title };
    }
  }
  return { part: "Unknown", title: "" };
}

// ---------------------------------------------------------------------------
// Markdown parsing and chunking
// ---------------------------------------------------------------------------

/** Rough token count (~4 chars per token for English) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Remove base64 image data, markdown image refs, and markdown formatting noise */
function cleanMarkdown(text: string): string {
  return (
    text
      // Remove base64 image references and inline images
      .replace(/\[image\d+\]:\s*<data:image[^>]*>/g, "")
      .replace(/!\[(?:[^\]]*)\]\([^)]*\)/g, "")
      // Remove HTML image tags
      .replace(/<img[^>]*>/g, "")
      // Remove markdown link formatting but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove {#...} anchor IDs
      .replace(/\{#[^}]+\}/g, "")
      // Clean up bold/italic markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      // Remove backslash escapes
      .replace(/\\([!#])/g, "$1")
      // Collapse multiple blank lines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/** Parse the book markdown into chapter-delimited sections */
function parseChapters(lines: string[]): BookChapter[] {
  const chapters: BookChapter[] = [];
  const chapterRegex = /^##\s+\*{0,2}Chapter\s+(\d+)/i;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(chapterRegex);
    if (match) {
      const chapterNum = parseInt(match[1], 10);
      const partInfo = getPartForChapter(chapterNum);

      // Extract chapter title from the line
      let title = lines[i]
        .replace(/^##\s+/, "")
        .replace(/\{#[^}]+\}/g, "")
        .replace(/\*{1,3}/g, "")
        .replace(/\\([!#])/g, "$1")
        .trim();

      // Remove "Chapter N:" prefix from title for cleaner metadata
      title = title.replace(/^Chapter\s+\d+:\s*/i, "").trim();

      chapters.push({
        part: partInfo.part,
        partTitle: partInfo.title,
        chapter: `Chapter ${chapterNum}`,
        chapterTitle: title,
        startLine: i,
      });
    }
  }

  return chapters;
}

/** Split a chapter's text into chunks of ~500 tokens, respecting paragraph boundaries */
function chunkText(
  text: string,
  maxTokens: number = 500,
  overlapTokens: number = 50
): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    const currentTokens = estimateTokens(currentChunk);
    const paragraphTokens = estimateTokens(trimmed);

    // If adding this paragraph exceeds max, save current and start new
    if (currentTokens + paragraphTokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());

      // Add overlap: take the last ~overlapTokens of text from current chunk
      const overlapChars = overlapTokens * 4;
      const overlap = currentChunk.slice(-overlapChars).trim();
      // Start new chunk with overlap context if it's meaningful
      if (overlap.length > 20) {
        currentChunk = overlap + "\n\n" + trimmed;
      } else {
        currentChunk = trimmed;
      }
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + trimmed : trimmed;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/** Build structured chunks from the book with metadata */
function buildChunks(bookPath: string): BookChunk[] {
  const content = fs.readFileSync(bookPath, "utf-8");
  const lines = content.split("\n");
  const chapters = parseChapters(lines);

  console.log(`Found ${chapters.length} chapters in book`);

  const allChunks: BookChunk[] = [];

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const nextStart =
      i + 1 < chapters.length ? chapters[i + 1].startLine : lines.length;

    // Extract chapter content (from start to next chapter or end)
    const chapterLines = lines.slice(chapter.startLine, nextStart);
    const rawText = chapterLines.join("\n");
    const cleanedText = cleanMarkdown(rawText);

    if (!cleanedText || estimateTokens(cleanedText) < 20) {
      console.log(`  Skipping ${chapter.chapter} (too short after cleaning)`);
      continue;
    }

    const textChunks = chunkText(cleanedText);

    const chapterNum = parseInt(chapter.chapter.replace("Chapter ", ""), 10);
    const pageRange = CHAPTER_PAGES[chapterNum] || "";

    console.log(
      `  ${chapter.chapter}: "${chapter.chapterTitle}" → ${textChunks.length} chunks (~${estimateTokens(cleanedText)} tokens)`
    );

    for (const chunk of textChunks) {
      allChunks.push({
        chunkText: chunk,
        chapter: `${chapter.part} - ${chapter.chapter}: ${chapter.chapterTitle}`,
        section: `${chapter.part}: ${chapter.partTitle}`,
        pageRange,
      });
    }
  }

  return allChunks;
}

// ---------------------------------------------------------------------------
// Insforge API helpers (standalone, no import of src/lib)
// ---------------------------------------------------------------------------

async function generateEmbedding(text: string): Promise<number[] | null> {
  const token = INSFORGE_ANON_KEY || INSFORGE_API_KEY;
  try {
    const res = await fetch(`${INSFORGE_URL}/api/ai/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  Embedding API error: ${res.status} ${errText}`);
      return null;
    }

    const json = (await res.json()) as {
      data: { embedding: number[] }[];
    };
    return json.data[0]?.embedding ?? null;
  } catch (err) {
    console.error(`  Embedding request failed:`, err);
    return null;
  }
}

async function insertBookEmbedding(params: {
  chunk_text: string;
  embedding: number[];
  chapter: string;
  section: string;
  page_range: string;
}): Promise<boolean> {
  try {
    const res = await fetch(
      `${INSFORGE_URL}/api/database/records/book_embeddings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${INSFORGE_API_KEY}`,
        },
        body: JSON.stringify([
          {
            chunk_text: params.chunk_text,
            embedding: JSON.stringify(params.embedding),
            chapter: params.chapter,
            section: params.section,
            page_range: params.page_range,
          },
        ]),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  Insert error: ${res.status} ${errText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`  Insert request failed:`, err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main ingestion pipeline
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Manager Elevator Book Ingestion ===");
  console.log(`Insforge URL: ${INSFORGE_URL}`);
  console.log();

  // Resolve book path relative to project root
  const bookPath = path.resolve(
    process.cwd(),
    "Dana Thompson_Bulletproof Your Manager Career_20260105.md"
  );

  if (!fs.existsSync(bookPath)) {
    console.error(`ERROR: Book file not found at ${bookPath}`);
    process.exit(1);
  }

  console.log("Step 1: Parsing and chunking book...");
  const chunks = buildChunks(bookPath);
  console.log(`\nTotal chunks: ${chunks.length}`);
  console.log(
    `Total estimated tokens: ${chunks.reduce((sum, c) => sum + estimateTokens(c.chunkText), 0)}`
  );
  console.log();

  console.log("Step 2: Generating embeddings and storing in database...");
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const progress = `[${i + 1}/${chunks.length}]`;

    // Rate limit: small delay between requests to avoid hitting rate limits
    if (i > 0 && i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Generate embedding
    const embedding = await generateEmbedding(chunk.chunkText);
    if (!embedding) {
      console.error(`${progress} FAILED to generate embedding for chunk`);
      errorCount++;
      continue;
    }

    // Store in database
    const stored = await insertBookEmbedding({
      chunk_text: chunk.chunkText,
      embedding,
      chapter: chunk.chapter,
      section: chunk.section,
      page_range: chunk.pageRange,
    });

    if (stored) {
      successCount++;
      if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
        console.log(
          `${progress} Stored: ${chunk.chapter} (${estimateTokens(chunk.chunkText)} tokens)`
        );
      }
    } else {
      console.error(`${progress} FAILED to store chunk`);
      errorCount++;
    }
  }

  console.log();
  console.log("=== Ingestion Complete ===");
  console.log(`Chunks created: ${chunks.length}`);
  console.log(`Embeddings stored: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
