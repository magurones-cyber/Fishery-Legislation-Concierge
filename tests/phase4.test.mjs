import test from "node:test";
import assert from "node:assert/strict";

const { createOcrProvider } = await import("../lib/ocr/provider.ts");
const { externalIntegrations, faqCandidates, offlinePolicy, photoAttachmentTypes, tenantSettings, usageMetrics } = await import("../lib/phase4-data.ts");

test("manual OCR provider detects text-poor PDFs as OCR required", async () => {
  const provider = createOcrProvider("manual");
  const status = await provider.detect({ documentId: "doc-1", storagePath: "documents/doc-1.pdf", mimeType: "application/pdf" }, "短い");

  assert.equal(status, "required");
});

test("FAQ candidates require admin review and are not automatically published", () => {
  assert.ok(faqCandidates.length > 0);
  assert.ok(faqCandidates.every((candidate) => candidate.status !== "公開"));
  assert.ok(faqCandidates[0].sources.length > 0);
});

test("photo attachment types include field evidence and accounting evidence", () => {
  assert.ok(photoAttachmentTypes.includes("現地写真"));
  assert.ok(photoAttachmentTypes.includes("領収書"));
  assert.ok(photoAttachmentTypes.includes("排水状況"));
});

test("tenant and offline settings protect multi-tenant and confidential data", () => {
  assert.ok(tenantSettings.some(([label]) => label === "自治体名"));
  assert.equal(offlinePolicy.confidentialOfflineDefault, false);
  assert.ok(offlinePolicy.cacheTargets.includes("未送信メモ"));
});

test("usage metrics and external integration plan cover production operations", () => {
  assert.ok(usageMetrics.some((metric) => metric.label === "更新期限切れ資料"));
  assert.ok(externalIntegrations.some((integration) => integration.name === "e-Gov法令API"));
  assert.ok(externalIntegrations.some((integration) => integration.name === "CSVエクスポート"));
});
