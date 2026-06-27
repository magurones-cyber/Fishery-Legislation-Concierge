import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dashboard carries entered text to ask and search", async () => {
  const [entry, askPage, askPanel, searchPanel, dashboard] = await Promise.all([
    readFile("components/dashboard/question-entry.tsx", "utf8"),
    readFile("app/ask/page.tsx", "utf8"),
    readFile("components/rag/ask-panel.tsx", "utf8"),
    readFile("components/rag/search-panel.tsx", "utf8"),
    readFile("app/dashboard/page.tsx", "utf8")
  ]);

  assert.match(entry, /params\.set\("q", query\)/);
  assert.match(entry, /params\.set\("auto", "1"\)/);
  assert.match(askPage, /initialQuestion=/);
  assert.match(askPage, /autoSubmit=/);
  assert.match(askPanel, /useState\(initialQuestion\)/);
  assert.match(askPanel, /autoSubmittedRef/);
  assert.match(searchPanel, /searchParams\.get\("q"\)/);
  assert.match(dashboard, /listRecentQuestions/);
  assert.doesNotMatch(dashboard, /recentQuestions } from "@\/lib\/mock-data"/);
});

test("document screens use Supabase-backed document queries", async () => {
  const [listPage, detailPage, adminPage, searchRoute] = await Promise.all([
    readFile("app/documents/page.tsx", "utf8"),
    readFile("app/documents/[id]/page.tsx", "utf8"),
    readFile("app/admin/documents/page.tsx", "utf8"),
    readFile("app/api/search/route.ts", "utf8")
  ]);

  assert.match(listPage, /listReadableDocuments/);
  assert.doesNotMatch(listPage, /lib\/mock-data/);
  assert.match(detailPage, /getReadableDocument/);
  assert.doesNotMatch(detailPage, /lib\/mock-data/);
  assert.match(adminPage, /listReadableDocuments/);
  assert.match(searchRoute, /searchDocumentMetadata/);
});

test("mobile shell prevents horizontal overflow", async () => {
  const [globalCss, shell, dashboard] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("components/layout/app-shell.tsx", "utf8"),
    readFile("app/dashboard/page.tsx", "utf8")
  ]);

  assert.match(globalCss, /overflow-x: hidden/);
  assert.match(shell, /min-w-0 overflow-x-clip/);
  assert.match(dashboard, /grid-cols-2/);
});

test("document management supports batch upload, auto category, edit, and logical delete", async () => {
  const [uploadForm, uploadRoute, editRoute, adminDetail, classifier, documentsLib, documentsPage, adminDocumentsPage] = await Promise.all([
    readFile("components/rag/document-upload-form.tsx", "utf8"),
    readFile("app/api/admin/documents/route.ts", "utf8"),
    readFile("app/api/admin/documents/[id]/route.ts", "utf8"),
    readFile("app/admin/documents/[id]/page.tsx", "utf8"),
    readFile("lib/rag/category-classifier.ts", "utf8"),
    readFile("lib/documents.ts", "utf8"),
    readFile("app/documents/page.tsx", "utf8"),
    readFile("app/admin/documents/page.tsx", "utf8")
  ]);

  assert.match(uploadForm, /onDrop=/);
  assert.match(uploadForm, /multiple/);
  assert.match(uploadForm, /\.xml/);
  assert.match(uploadForm, /\.rtf/);
  assert.match(uploadForm, /categoryMode/);
  assert.match(uploadRoute, /formData\.getAll\("files"\)/);
  assert.match(uploadRoute, /return "xml"/);
  assert.match(uploadRoute, /return "rtf"/);
  assert.match(uploadRoute, /classifyCategoryCode/);
  assert.match(uploadRoute, /buildMetadataChunk/);
  assert.match(uploadRoute, /資料情報のみ検索対象として登録/);
  assert.match(editRoute, /export async function PATCH/);
  assert.match(editRoute, /export async function DELETE/);
  assert.match(editRoute, /deleted_at/);
  assert.match(adminDetail, /DocumentEditForm/);
  assert.match(classifier, /漁港/);
  assert.match(classifier, /補助金/);
  assert.match(documentsLib, /\.is\("deleted_at", null\)/);
  assert.match(documentsPage, /document\.processingError/);
  assert.match(adminDocumentsPage, /Boolean\(document\.processingError\)/);
});
