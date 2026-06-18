import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");
const defaultOrgId = "00000000-0000-0000-0000-000000000000";

test("default organization is upserted before seed data references it", () => {
  const initialSchema = read("supabase/migrations/202606130001_initial_schema.sql");
  const defaultOrganization = read("supabase/migrations/202606130002_default_organization.sql");
  const seed = read("supabase/seed.sql");

  for (const sql of [initialSchema, defaultOrganization, seed]) {
    assert.match(sql, new RegExp(`insert into public\\.organizations[\\s\\S]+${defaultOrgId}`));
    assert.match(sql, /'デフォルト組織'/);
    assert.match(sql, /'system'/);
    assert.match(sql, /on conflict \(id\) do update/);
  }

  assert.ok(seed.indexOf("insert into public.organizations") < seed.indexOf("insert into public.categories"));
  assert.ok(seed.indexOf("insert into public.organizations") < seed.indexOf("insert into public.tags"));
  assert.ok(seed.indexOf("insert into public.organizations") < seed.indexOf("insert into public.prompt_templates"));
  assert.ok(seed.indexOf("insert into public.organizations") < seed.indexOf("insert into public.checklists"));
});

test("migrations that seed organization scoped records ensure the default organization first", () => {
  const files = [
    "supabase/migrations/202606140002_recreational_fishing_boat_categories.sql",
    "supabase/migrations/202606140003_log_analysis_consent_phase2.sql",
    "supabase/migrations/202606140004_phase2_checklists_templates.sql",
    "supabase/migrations/202606140005_recreational_boat_integrated_additions.sql",
    "supabase/migrations/202606140006_phase2_case_management.sql",
    "supabase/migrations/202606140007_phase3_admin_audit_security.sql",
    "supabase/migrations/202606140008_phase4_operations_integrations.sql",
    "supabase/migrations/202606140009_phase5_release_hardening.sql",
    "supabase/migrations/202606140011_question_log_access_control.sql",
    "supabase/migrations/202606140012_security_privacy_hardening.sql",
    "supabase/migrations/202606140013_auth_invitation_policy.sql"
  ];

  for (const file of files) {
    const sql = read(file);
    assert.match(sql, new RegExp(`insert into public\\.organizations[\\s\\S]+${defaultOrgId}`), file);
    assert.match(sql, /on conflict \(id\) do update/, file);
  }
});

test("deployment docs require default organization before category and seed inserts", () => {
  const deployment = read("docs/deployment.md");
  const readme = read("README.md");

  assert.match(deployment, /202606130002_default_organization\.sql/);
  assert.match(deployment, /デフォルト組織投入後にカテゴリ/);
  assert.match(deployment, /カテゴリ・タグ関連SQLだけを再実行する場合も/);
  assert.match(readme, /デフォルト組織を投入/);
});
