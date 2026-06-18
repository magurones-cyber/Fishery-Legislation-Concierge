import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("document chunk embeddings and indexes use 1536 dimensions", () => {
  const initialSchema = read("supabase/migrations/202606130001_initial_schema.sql");
  assert.match(initialSchema, /embedding vector\(1536\)/);
  assert.match(initialSchema, /create index if not exists document_chunks_embedding_idx[\s\S]+using ivfflat/);
  assert.doesNotMatch(initialSchema, /embedding vector\(3072\)/);
});

test("RAG search functions accept 1536-dimension embeddings", () => {
  const phase1 = read("supabase/migrations/202606140001_phase1_rag.sql");
  const categorySearch = read("supabase/migrations/202606140002_recreational_fishing_boat_categories.sql");
  const correction = read("supabase/migrations/202606150001_embedding_1536_pgvector.sql");

  for (const sql of [phase1, categorySearch, correction]) {
    assert.match(sql, /query_embedding vector\(1536\)/);
  }

  assert.match(correction, /public\.match_documents\(\s*query_embedding vector\(1536\)/);
  assert.match(correction, /drop function if exists public\.hybrid_search_document_chunks/);
});

test("OpenAI embedding defaults match pgvector index limit", () => {
  const envExample = read(".env.example");
  const openai = read("lib/rag/openai.ts");
  const readme = read("README.md");
  const deployment = read("docs/deployment.md");

  assert.match(envExample, /EMBEDDING_MODEL=text-embedding-3-small/);
  assert.match(envExample, /EMBEDDING_DIMENSIONS=1536/);
  assert.match(openai, /DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"/);
  assert.match(openai, /DEFAULT_EMBEDDING_DIMENSIONS = 1536/);
  assert.match(openai, /dimensions: getEmbeddingDimensions\(\)/);
  assert.match(readme, /ivfflat.*2000 次元/s);
  assert.match(deployment, /途中まで作成されたテーブルのリセットSQL/);
});
