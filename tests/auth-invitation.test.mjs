import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("Supabase project setup is operator-managed and documented", () => {
  const readme = read("README.md");
  const deployment = read("docs/deployment.md");
  for (const text of [readme, deployment]) {
    assert.match(text, /Supabase.*Project.*アプリから自動作成しません|Projectは、アプリから自動作成しません/s);
    assert.match(text, /運営者.*アカウント/);
    assert.match(text, /Project URL/);
    assert.match(text, /publishable key/);
    assert.match(text, /secret key/);
  }
});

test("environment variables distinguish browser publishable key from server secrets", () => {
  const env = read(".env.example");
  assert.match(env, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(env, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(env, /SUPABASE_SECRET_KEY/);
  assert.match(env, /OPENAI_API_KEY/);
  assert.doesNotMatch(env, /NEXT_PUBLIC_SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(env, /NEXT_PUBLIC_OPENAI_API_KEY/);
});

test("Supabase clients keep secret key server-side and publishable key client-side", () => {
  assert.match(read("lib/supabase.ts"), /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(read("lib/supabase.ts"), /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(read("lib/supabase-admin.ts"), /SUPABASE_SECRET_KEY/);
  assert.match(read("lib/supabase-admin.ts"), /SUPABASE_SERVICE_ROLE_KEY/);
});

test("login supports password and magic link without free signup", () => {
  const login = read("components/auth/login-form.tsx");
  assert.match(login, /signInWithPassword/);
  assert.match(login, /signInWithOtp/);
  assert.match(login, /shouldCreateUser: false/);
  assert.match(read("app/login/page.tsx"), /管理者招待制/);
});

test("admin invitation route assigns organization, role, and audit log", () => {
  const route = read("app/api/admin/users/invite/route.ts");
  assert.match(route, /inviteUserByEmail/);
  assert.match(route, /organization_id/);
  assert.match(route, /user_organizations/);
  assert.match(route, /user_roles/);
  assert.match(route, /user_invite/);
  assert.match(route, /ADMIN_INVITE_TOKEN/);
  assert.match(read("app/admin/users/page.tsx"), /ユーザー招待/);
});

test("question API requires consent and Auth policy migration documents invitation-only operation", () => {
  assert.match(read("app/api/ask/route.ts"), /consentAccepted/);
  assert.match(read("app/api/ask/route.ts"), /同意が必要/);
  const sql = read("supabase/migrations/202606140013_auth_invitation_policy.sql");
  assert.match(sql, /user_invitations/);
  assert.match(sql, /invitation_required/);
  assert.match(sql, /free_signup/);
  assert.match(sql, /initial_consent_required/);
});
