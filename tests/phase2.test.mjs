import test from "node:test";
import assert from "node:assert/strict";

const { buildGeneratedDocument, caseRecords, checklistRecords, documentTemplates, isOverdue, userRoles } = await import("../lib/phase2-data.ts");

test("phase 2 roles include the requested operational permissions", () => {
  const municipalityStaff = userRoles.find((role) => role.key === "municipality_staff");
  const coopStaff = userRoles.find((role) => role.key === "fisheries_coop_staff");

  assert.ok(coopStaff?.permissions.includes("漁業者指導記録"));
  assert.ok(municipalityStaff?.permissions.includes("案件管理"));
});

test("case records expose deadline warning inputs and required operational fields", () => {
  const overdueCase = caseRecords.find((record) => record.caseNumber === "CASE-2026-0002");

  assert.equal(overdueCase?.category, "漁港利用");
  assert.equal(isOverdue("2000-01-01"), true);
  assert.equal(overdueCase?.sources.length, 1);
  assert.match(overdueCase?.internalMemo ?? "", /期限超過/);
});

test("phase 2 checklists include port use, subsidy, and coop guidance items", () => {
  const portUse = checklistRecords.find((record) => record.id === "port-use");
  const subsidy = checklistRecords.find((record) => record.id === "subsidy");
  const coopGuidance = checklistRecords.find((record) => record.id === "coop-guidance");

  assert.ok(portUse?.items.includes("補助金財産処分"));
  assert.ok(subsidy?.items.includes("消費税"));
  assert.ok(coopGuidance?.items.includes("説明責任"));
});

test("generated documents preserve case, AI answer, sources, and next action", () => {
  const record = caseRecords[0];
  const content = buildGeneratedDocument("漁協向け指導メモ", record);

  assert.ok(documentTemplates.includes("漁協向け指導メモ"));
  assert.match(content, new RegExp(record.caseNumber));
  assert.match(content, /AI回答・整理/);
  assert.match(content, /遊漁船業法/);
  assert.match(content, /次回対応日/);
});
