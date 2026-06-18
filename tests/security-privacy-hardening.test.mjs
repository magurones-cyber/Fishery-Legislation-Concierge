import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("security hardening migration enables RLS for sensitive tables", () => {
  const sql = read("supabase/migrations/202606140012_security_privacy_hardening.sql");
  for (const table of ["qa_sessions", "qa_messages", "qa_sources", "consultation_cases", "favorites", "documents", "document_chunks", "audit_logs"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
});

test("question history is owner-only and individual admin access requires audit reason", () => {
  const sql = read("supabase/migrations/202606140012_security_privacy_hardening.sql");
  assert.match(sql, /qa sessions own history only/);
  assert.match(sql, /s\.user_id = auth\.uid\(\)/);
  assert.match(sql, /can_read_question_log_detail_admin/);
  assert.match(sql, /admin role required for individual question log access/);
  assert.match(sql, /access_reason not in/);
  assert.match(sql, /question_log_detail_view/);
  assert.match(sql, /insert into public\.audit_logs/);
});

test("storage and repository policies prevent public data leaks", () => {
  const sql = read("supabase/migrations/202606140012_security_privacy_hardening.sql");
  assert.match(sql, /update storage\.buckets/);
  assert.match(sql, /set public = false/);
  assert.match(sql, /documents.*attachments.*archives.*backups/s);
  const gitignore = read(".gitignore");
  for (const entry of [".env", "*.pdf", "backups", "exports", "qa-logs", "*.docx"]) {
    assert.match(gitignore, new RegExp(escapeRegExp(entry)));
  }
  assert.doesNotMatch(read(".env.example"), /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
});

test("question text is split and masked before AI submission", () => {
  const askRoute = read("app/api/ask/route.ts");
  assert.match(askRoute, /raw_text: question/);
  assert.match(askRoute, /masked_text: maskedQuestion/);
  assert.match(askRoute, /ai_sent_text: maskedQuestion/);
  assert.match(askRoute, /maskSensitiveText\(question\)/);
  const masking = read("lib/privacy/masking.ts");
  for (const marker of ["[氏名]", "[電話番号]", "[メールアドレス]", "[住所]", "[船名]", "[口座情報]", "[事業者名]"]) {
    assert.match(masking, new RegExp(escapeRegExp(marker)));
  }
});

test("terms, privacy, and docs disclose log storage, admin access, AI transfer, retention, deletion, and consent", () => {
  const pagesAndDocs = [
    read("app/terms/page.tsx"),
    read("app/privacy/page.tsx"),
    read("docs/security.md"),
    read("docs/privacy.md")
  ].join("\n");

  for (const phrase of ["質問ログ", "管理者", "AI API", "保存期間", "削除", "user_consents", "署名付きURL", "service role key"]) {
    assert.match(pagesAndDocs, new RegExp(phrase));
  }
  assert.match(read("components/privacy/consent-form.tsx"), /\/api\/consent/);
  assert.match(read("app/api/consent/route.ts"), /user_consents/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
