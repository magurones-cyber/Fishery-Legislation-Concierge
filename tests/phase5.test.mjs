import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("production document upload requires an admin upload token", () => {
  const route = readFileSync(new URL("../app/api/admin/documents/route.ts", import.meta.url), "utf8");
  const env = readFileSync(new URL("../.env.example", import.meta.url), "utf8");

  assert.match(route, /ADMIN_UPLOAD_TOKEN/);
  assert.match(route, /NODE_ENV === "production"/);
  assert.match(env, /ADMIN_UPLOAD_TOKEN=change-this-before-production/);
});

test("document chunks and versions RLS are hardened by document visibility", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202606140009_phase5_release_hardening.sql", import.meta.url), "utf8");

  assert.match(migration, /read document versions by document visibility/);
  assert.match(migration, /read document chunks by document visibility/);
  assert.match(migration, /read document tags by document visibility/);
  assert.match(migration, /d\.visibility = 'public'/);
  assert.match(migration, /admin_only/);
});
