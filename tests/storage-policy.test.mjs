import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("GitHub exclusion rules cover production data and secrets", () => {
  const gitignore = read(".gitignore");
  for (const entry of ["data", "uploads", "backups", "exports", "embeddings", "real-data", "*.pdf", "*.docx", ".env.*"]) {
    assert.match(gitignore, new RegExp(escapeRegExp(entry)));
  }
  assert.match(gitignore, /!\.env\.example/);
  assert.match(gitignore, /!supabase\/migrations\/\*\.sql/);
});

test("repo size check is wired into build", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["check:repo-size"], "node scripts/check-repo-size.mjs");
  assert.equal(pkg.scripts.prebuild, "npm run check:repo-size");
  assert.match(read("scripts/check-repo-size.mjs"), /50 \* 1024 \* 1024/);
  assert.match(read("scripts/check-repo-size.mjs"), /forbiddenRootDirs/);
});

test("storage adapter exists and document upload uses it", () => {
  assert.match(read("lib/storage/index.ts"), /createStorageAdapter/);
  assert.match(read("lib/storage/supabase-storage.ts"), /SupabaseStorageAdapter/);
  assert.match(read("lib/storage/external-storage.ts"), /ExternalStorageAdapter/);
  const route = read("app/api/admin/documents/route.ts");
  assert.match(route, /createStorageAdapter/);
  assert.match(route, /getDocumentBucket/);
  assert.doesNotMatch(route, /storage\.from\("documents"\)\.upload/);
});

test("storage docs and migration describe archive and transfer management", () => {
  assert.match(read("docs/storage.md"), /GitHubには再現に必要なコード/);
  assert.match(read("docs/storage.md"), /storage_transfer_jobs/);
  assert.match(read("supabase/migrations/202606140010_storage_archive_policy.sql"), /create table if not exists storage_transfer_jobs/);
  assert.match(read("supabase/migrations/202606140010_storage_archive_policy.sql"), /create table if not exists archive_records/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
