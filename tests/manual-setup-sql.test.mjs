import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const manualDir = "supabase/manual-setup";
const read = (file) => fs.readFileSync(file, "utf8");

const setupFiles = [
  "00_enable_extensions.sql",
  "01_core_schema.sql",
  "02_auth_org_roles.sql",
  "03_documents_rag_schema.sql",
  "04_qa_logs_analytics_schema.sql",
  "05_policies.sql",
  "06_seed_master_data.sql",
  "07_storage_notes.sql",
  "08_auth_connection.sql",
  "99_reset_dev_only.sql",
  "all_in_one_setup.sql"
];

test("manual setup SQL files exist in SQL Editor order", () => {
  for (const file of setupFiles) {
    assert.ok(fs.existsSync(path.join(manualDir, file)), file);
  }

  const deployment = read("docs/deployment.md");
  for (const file of setupFiles.filter((file) => file !== "99_reset_dev_only.sql")) {
    assert.match(deployment, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("manual setup uses 1536-dimension embeddings and avoids creating 3072 vectors", () => {
  const combinedSql = setupFiles
    .filter((file) => file !== "99_reset_dev_only.sql")
    .map((file) => read(path.join(manualDir, file)))
    .join("\n");

  assert.match(combinedSql, /embedding vector\(1536\)/);
  assert.match(combinedSql, /query_embedding vector\(1536\)/);
  assert.match(combinedSql, /using ivfflat \(embedding vector_cosine_ops\)/);
  assert.doesNotMatch(combinedSql, /vector\(3072\)/);
  assert.doesNotMatch(combinedSql, /embedding vector\(3072\)/);
  assert.doesNotMatch(combinedSql, /query_embedding vector\(3072\)/);
  assert.match(read(".env.example"), /EMBEDDING_MODEL=text-embedding-3-small/);
  assert.match(read(".env.example"), /EMBEDDING_DIMENSIONS=1536/);
});

test("normal manual setup files do not contain destructive reset operations", () => {
  for (const file of setupFiles.filter((file) => !["99_reset_dev_only.sql"].includes(file))) {
    const sql = read(path.join(manualDir, file));
    assert.doesNotMatch(sql, /\bdrop table\b/i, file);
    assert.doesNotMatch(sql, /\btruncate\b/i, file);
    assert.doesNotMatch(sql, /\bdelete from\b/i, file);
  }

  assert.match(read(path.join(manualDir, "99_reset_dev_only.sql")), /Do not run this against production/);
  assert.match(read(path.join(manualDir, "99_reset_dev_only.sql")), /\bdrop table\b/i);
});

test("manual setup creates tables and indexes idempotently", () => {
  const schemaSql = [
    read(path.join(manualDir, "01_core_schema.sql")),
    read(path.join(manualDir, "03_documents_rag_schema.sql")),
    read(path.join(manualDir, "04_qa_logs_analytics_schema.sql"))
  ].join("\n");

  assert.doesNotMatch(schemaSql, /create table public\./);
  assert.match(schemaSql, /create table if not exists public\.organizations/);
  assert.match(schemaSql, /display_name text/);
  assert.match(schemaSql, /alter table public\.organizations[\s\S]+add column if not exists display_name text/);
  assert.match(schemaSql, /create table if not exists public\.document_chunks/);
  assert.match(schemaSql, /create index if not exists document_chunks_embedding_ivfflat_idx/);
});

test("all-in-one public inserts only use columns declared by create or alter table", () => {
  const sql = read(path.join(manualDir, "all_in_one_setup.sql"));
  const tableColumns = new Map();

  for (const match of sql.matchAll(/create table if not exists public\.([a-z_]+)\s*\(([\s\S]*?)\n\);/g)) {
    const [, tableName, body] = match;
    tableColumns.set(tableName, new Set(extractColumnNames(body)));
  }

  for (const match of sql.matchAll(/alter table public\.([a-z_]+)\s+([\s\S]*?);/g)) {
    const [, tableName, body] = match;
    const columns = tableColumns.get(tableName) ?? new Set();
    for (const columnMatch of body.matchAll(/add column if not exists ([a-z_]+)/g)) {
      columns.add(columnMatch[1]);
    }
    tableColumns.set(tableName, columns);
  }

  for (const match of sql.matchAll(/insert into public\.([a-z_]+)\s*\(([^)]+)\)/g)) {
    const [, tableName, columnList] = match;
    const columns = tableColumns.get(tableName);
    assert.ok(columns, `missing table declaration for ${tableName}`);

    for (const column of columnList.split(",").map((value) => value.trim()).filter(Boolean)) {
      assert.ok(columns.has(column), `missing ${tableName}.${column}`);
    }
  }
});

test("manual policies are recreated with drop policy if exists first", () => {
  const policyFiles = ["05_policies.sql", "07_storage_notes.sql"];

  for (const file of policyFiles) {
    const sql = read(path.join(manualDir, file));
    const createPolicyMatches = [...sql.matchAll(/create policy "([^"]+)"/g)];
    assert.ok(createPolicyMatches.length > 0, file);

    for (const match of createPolicyMatches) {
      const policyName = match[1];
      const before = sql.slice(0, match.index);
      assert.match(before, new RegExp(`drop policy if exists "${escapeRegExp(policyName)}"`), `${file}: ${policyName}`);
    }
  }
});

test("manual seed inserts default organization before scoped master data", () => {
  const seed = read(path.join(manualDir, "06_seed_master_data.sql"));

  assert.ok(seed.indexOf("insert into public.organizations") < seed.indexOf("insert into public.categories"));
  assert.ok(seed.indexOf("insert into public.organizations") < seed.indexOf("insert into public.tags"));
  assert.ok(seed.indexOf("insert into public.organizations") < seed.indexOf("insert into public.prompt_templates"));
  assert.ok(seed.indexOf("insert into public.organizations") < seed.indexOf("insert into public.checklists"));
  assert.match(seed, /03', '漁港・漁場・漁港施設等活用'/);
  assert.match(seed, /10', '地域振興・浜プラン・海業'/);
  assert.match(seed, /12', '遊漁船・海洋レジャー・安全管理'/);

  for (const tag of ["遊漁船", "遊漁船業", "遊漁船業法", "廃業届出", "気象海象", "掲示義務", "瀬渡し", "渡船", "釣り船", "釣船", "船釣り", "漁港出航"]) {
    assert.match(seed, new RegExp(escapeRegExp(tag)));
  }
});

test("all-in-one setup is a real combined SQL file", () => {
  const allInOne = read(path.join(manualDir, "all_in_one_setup.sql"));

  assert.match(allInOne, /Source: supabase\/manual-setup\/00_enable_extensions\.sql/);
  assert.match(allInOne, /Source: supabase\/manual-setup\/07_storage_notes\.sql/);
  assert.match(allInOne, /Source: supabase\/manual-setup\/08_auth_connection\.sql/);
  assert.match(allInOne, /create extension if not exists vector/);
  assert.match(allInOne, /create table if not exists public\.organizations/);
  assert.match(allInOne, /create or replace function public\.hybrid_search_document_chunks/);
  assert.match(allInOne, /create policy "read documents in org by visibility"/);
  assert.match(allInOne, /insert into public\.categories/);
  assert.doesNotMatch(allInOne, /order by score desc/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractColumnNames(body) {
  const reserved = new Set(["primary", "unique", "constraint", "foreign", "check"]);
  return body
    .split("\n")
    .map((line) => line.trim().replace(/,$/, ""))
    .filter(Boolean)
    .map((line) => line.split(/\s+/)[0])
    .filter((name) => /^[a-z_][a-z0-9_]*$/.test(name))
    .filter((name) => !reserved.has(name));
}
