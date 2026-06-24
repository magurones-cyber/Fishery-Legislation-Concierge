import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dashboard carries entered text to ask and search", async () => {
  const [entry, askPage, askPanel, searchPanel] = await Promise.all([
    readFile("components/dashboard/question-entry.tsx", "utf8"),
    readFile("app/ask/page.tsx", "utf8"),
    readFile("components/rag/ask-panel.tsx", "utf8"),
    readFile("components/rag/search-panel.tsx", "utf8")
  ]);

  assert.match(entry, /encodeURIComponent\(query\)/);
  assert.match(entry, /\?q=/);
  assert.match(askPage, /initialQuestion=/);
  assert.match(askPanel, /useState\(initialQuestion\)/);
  assert.match(searchPanel, /searchParams\.get\("q"\)/);
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
