import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("question log analytics exposes all required anonymous aggregate axes", () => {
  const data = read("lib/question-log-analytics.ts");
  for (const key of ["byCategory", "byOrganization", "byPeriod", "byConfidence", "byMissingSource", "byFeedback"]) {
    assert.match(data, new RegExp(key));
  }
  assert.match(data, /maskedQuestion/);
  assert.doesNotMatch(read("app/admin/analytics/page.tsx"), /山田|090-1234|test@example/);
});

test("individual question log access requires the requested reasons and audit API", () => {
  const data = read("lib/question-log-analytics.ts");
  for (const reason of ["問い合わせ対応", "不具合調査", "FAQ改善", "研修テーマ抽出", "不足資料確認", "漁協支援", "事故・トラブル対応", "監査", "その他"]) {
    assert.match(data, new RegExp(reason));
  }
  const form = read("components/admin/question-log-access-form.tsx");
  assert.match(form, /閲覧理由/);
  assert.ok(form.includes("/api/admin/question-logs/access"));
  assert.match(read("app/api/admin/question-logs/access/route.ts"), /question_log_detail_view/);
  const detailPage = read("app/admin/analytics/questions/[id]/page.tsx");
  assert.doesNotMatch(detailPage, /findIndividualQuestionLog/);
  assert.doesNotMatch(detailPage, /log\.question|log\.aiAnswer|log\.sources/);
});

test("question log RLS migration separates summary and detail permissions", () => {
  const sql = read("supabase/migrations/202606140011_question_log_access_control.sql");
  assert.match(sql, /question_log_access_events/);
  assert.match(sql, /can_read_question_log_summary/);
  assert.match(sql, /can_read_question_log_detail/);
  assert.match(sql, /record_question_log_access/);
  assert.match(sql, /question_log_analytics_summary/);
  assert.match(sql, /audit_logs/);
  assert.match(sql, /fisheries_coop_manager/);
  assert.match(sql, /municipality_manager/);
});
