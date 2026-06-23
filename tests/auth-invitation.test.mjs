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
  assert.match(login, /\/auth\/callback\?next=\/consent/);
  assert.match(read("app/auth/callback/route.ts"), /exchangeCodeForSession/);
  const confirmRoute = read("app/auth/confirm/route.ts");
  assert.match(confirmRoute, /verifyOtp/);
  assert.match(confirmRoute, /token_hash/);
  assert.match(read("middleware.ts"), /\/auth\/confirm/);
  assert.match(read("middleware.ts"), /supabase\.auth\.getUser/);
  assert.match(read("app/login/page.tsx"), /管理者招待制/);
});

test("admin invitation route assigns organization, role, and audit log", () => {
  const route = read("app/api/admin/users/invite/route.ts");
  assert.match(route, /inviteUserByEmail/);
  assert.match(route, /organization_id/);
  assert.match(route, /user_organizations/);
  assert.match(route, /user_roles/);
  assert.match(route, /user_invite/);
  assert.match(route, /requireApiAuth/);
  assert.match(route, /ADMIN_ROLES/);
  assert.match(route, /role === "system_admin"/);
  assert.match(read("app/admin/users/page.tsx"), /ユーザー招待/);
});

test("question API derives consent, organization, and role from authenticated session", () => {
  const ask = read("app/api/ask/route.ts");
  assert.match(ask, /requireApiAuth/);
  assert.match(ask, /auth\.context\.organizationId/);
  assert.match(ask, /audienceRoleFor\(auth\.context\)/);
  assert.doesNotMatch(ask, /consentAccepted|body\.role/);
  const sql = read("supabase/migrations/202606140013_auth_invitation_policy.sql");
  assert.match(sql, /user_invitations/);
  assert.match(sql, /invitation_required/);
  assert.match(sql, /free_signup/);
  assert.match(sql, /initial_consent_required/);
});

test("admin pages and APIs use server-side role checks", () => {
  const layout = read("app/admin/layout.tsx");
  assert.match(layout, /ADMIN_ROLES/);
  assert.match(layout, /hasAnyRole/);
  assert.match(read("app/api/admin/question-logs/access/route.ts"), /QUESTION_LOG_ADMIN_ROLES/);
  assert.match(read("app/api/admin/documents/route.ts"), /DOCUMENT_EDITOR_ROLES/);
});

test("service worker does not cache authenticated application pages", () => {
  const worker = read("public/sw.js");
  for (const path of ["/dashboard", "/ask", "/documents", "/cases", "/admin"]) {
    assert.doesNotMatch(worker, new RegExp(`\"${path}\"`));
  }
  assert.doesNotMatch(worker, /"\/login"/);
  assert.match(worker, /PUBLIC_PAGE_PATHS/);
});
