import test from "node:test";
import assert from "node:assert/strict";

const { chunkPages } = await import("../lib/rag/chunk.ts");
const { canReadVisibility } = await import("../lib/rag/access.ts");
const { buildAnswerPrompt } = await import("../lib/rag/openai.ts");
const { classifyCategoryCodes } = await import("../lib/rag/classify.ts");
const { maskSensitiveText } = await import("../lib/privacy/masking.ts");

test("law-like text is chunked by article number", () => {
  const chunks = chunkPages(
    [
      {
        pageNumber: 3,
        text: "第一条 この法律は水産業の健全な発展を目的とする。\n\n第二条 漁業者とは..."
      }
    ],
    "law"
  );

  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].articleNumber, "第一条");
  assert.equal(chunks[0].pageStart, 3);
});

test("visibility rank excludes admin-only documents from public users", () => {
  assert.equal(canReadVisibility("public", "public"), true);
  assert.equal(canReadVisibility("public", "admin_only"), false);
  assert.equal(canReadVisibility("admin", "admin_only"), true);
});

test("answer prompt preserves required headings and citations", () => {
  const prompt = buildAnswerPrompt("漁港用地で陸上養殖できますか。", [
    {
      chunk_id: "chunk-1",
      document_id: "doc-1",
      document_version_id: "version-1",
      title: "漁港用地利用メモ",
      source_type: "internal_memo",
      document_number: null,
      issuing_authority: "水産課",
      last_amended_at: "2026-06-01",
      visibility: "municipality_staff",
      category_name: "漁港・漁場・海業",
      article_number: "第1条",
      page_start: 2,
      page_end: 2,
      heading: "試験利用",
      content: "試験利用は所管部署への事前確認を要する。",
      citation_text: "試験利用は所管部署への事前確認を要する。",
      score: 0.9
    }
  ]);

  assert.match(prompt, /## 結論/);
  assert.match(prompt, /漁港用地利用メモ/);
  assert.match(prompt, /\/documents\/doc-1\?chunk=chunk-1/);
  assert.match(prompt, /遊漁船業に関する確認事項/);
});

test("recreational fishing boat questions prioritize category 12 and cross-search related categories", () => {
  assert.deepEqual(classifyCategoryCodes("漁港から遊漁船を出航させる場合の漁港管理上の確認事項"), ["12", "03"]);
  assert.deepEqual(classifyCategoryCodes("海業として遊漁船を浜プランに位置付ける"), ["12", "10"]);
  assert.deepEqual(classifyCategoryCodes("漁協所属の漁業者が遊漁船を始める"), ["12", "04"]);
  assert.deepEqual(classifyCategoryCodes("遊漁船の補助金と兼業支援を確認したい"), ["12", "06", "09"]);
});

test("masking removes contact details and vessel names from analytics text", () => {
  const result = maskSensitiveText("山田丸について test@example.com または 090-1234-5678 に連絡。");
  assert.equal(result.containsPersonalData, true);
  assert.match(result.maskedText, /\[メールアドレス\]/);
  assert.match(result.maskedText, /\[電話番号\]/);
  assert.match(result.maskedText, /\[船名\]/);
});
