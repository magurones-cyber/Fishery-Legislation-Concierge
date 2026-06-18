import test from "node:test";
import assert from "node:assert/strict";

const { answerSafetyWarnings, auditLogs, diffLines, isUpdateOverdue, managedDocuments, updateNotifications } = await import("../lib/phase3-data.ts");
const { maskSensitiveText } = await import("../lib/privacy/masking.ts");

test("phase 3 update management flags overdue documents", () => {
  const subsidy = managedDocuments.find((document) => document.id === "doc-subsidy");

  assert.equal(isUpdateOverdue(subsidy), true);
  assert.ok(subsidy.impactedFaq.includes("補助対象経費に消費税を含めてよいですか。"));
});

test("version diff marks added and removed text", () => {
  const document = managedDocuments.find((item) => item.id === "doc-port-use");
  const diffs = diffLines(document.oldText, document.newText);

  assert.ok(diffs.some((diff) => diff.type === "削除"));
  assert.ok(diffs.some((diff) => diff.type === "追加" && diff.text.includes("補助金財産処分")));
});

test("answer safety warnings detect missing, old, expired, internal-only, and uncited sources", () => {
  assert.ok(answerSafetyWarnings([]).some((warning) => warning.includes("根拠資料がありません")));

  const warnings = answerSafetyWarnings([
    { state: "旧版", visibility: "自治体内部資料", nextCheckedAt: "2000-01-01", hasCitation: false }
  ]);

  assert.ok(warnings.some((warning) => warning.includes("旧版資料")));
  assert.ok(warnings.some((warning) => warning.includes("更新期限切れ")));
  assert.ok(warnings.some((warning) => warning.includes("内部資料")));
  assert.ok(warnings.some((warning) => warning.includes("引用がない")));
});

test("audit logs and update notifications include required operational fields", () => {
  assert.ok(auditLogs.some((log) => log.action === "資料更新" && log.ipAddress));
  assert.ok(updateNotifications[0].impact.includes("漁港利用"));
});

test("masking detects phase 3 sensitive data types before AI submission", () => {
  const result = maskSensitiveText("氏名: 山田太郎 電話 090-1234-5678 口座 普通1234567 事業者名: 山田水産株式会社 案件名: 非公開A 第123-456号 山田丸");

  assert.equal(result.containsPersonalData, true);
  assert.match(result.maskedText, /\[氏名\]/);
  assert.match(result.maskedText, /\[電話番号\]/);
  assert.match(result.maskedText, /\[口座情報\]/);
  assert.match(result.maskedText, /\[事業者名\]|\[団体名\]/);
  assert.match(result.maskedText, /\[非公開案件名\]/);
  assert.match(result.maskedText, /\[船名\]/);
});
