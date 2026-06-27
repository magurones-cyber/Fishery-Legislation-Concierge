import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("PDF.js is externalized for the Vercel Node runtime", () => {
  assert.match(read("next.config.ts"), /serverExternalPackages:\s*\["pdfjs-dist"\]/);
});

test("PDF extraction reports a sanitized error code without file contents", () => {
  const extract = read("lib/rag/extract.ts");
  assert.match(extract, /extractionErrorCode/);
  assert.match(extract, /\[rag:extract\]/);
  assert.match(extract, /replace\(\/\[\^A-Za-z0-9_\]\/g/);
  assert.doesNotMatch(extract, /console\.error\([^\n]*error\.message/);
});

test("text extraction supports XML and RTF documents", () => {
  const extract = read("lib/rag/extract.ts");
  assert.match(extract, /isXmlFile/);
  assert.match(extract, /extractXmlText/);
  assert.match(extract, /isRtfFile/);
  assert.match(extract, /extractRtfText/);
  assert.match(extract, /XML、RTF/);
});
