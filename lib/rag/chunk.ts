import type { ExtractedPage, RagChunk } from "@/lib/rag/types";

const articlePattern = /(?:^|\n)\s*(第[一二三四五六七八九十百千0-9０-９]+条(?:の[一二三四五六七八九十百千0-9０-９]+)?)/g;
const headingPattern = /(?:^|\n)\s*(#{1,4}\s+.+|[0-9０-９]+[.．]\s*.+|[（(]?[一二三四五六七八九十]+[)）]\s*.+)/g;

export function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractArticleNumber(text: string) {
  const match = text.match(/第[一二三四五六七八九十百千0-9０-９]+条(?:の[一二三四五六七八九十百千0-9０-９]+)?/);
  return match?.[0] ?? null;
}

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 2);
}

export function chunkPages(pages: ExtractedPage[], sourceType: string): RagChunk[] {
  const chunks: RagChunk[] = [];

  for (const page of pages) {
    const text = normalizeText(page.text);
    if (!text) continue;
    const parts = splitByStructure(text, sourceType);
    for (const part of parts) {
      const normalized = normalizeText(part);
      if (!normalized) continue;
      for (const fragment of splitLongChunk(normalized, 1600)) {
        chunks.push({
          chunkIndex: chunks.length,
          pageStart: page.pageNumber,
          pageEnd: page.pageNumber,
          articleNumber: extractArticleNumber(fragment),
          heading: extractHeading(fragment),
          content: fragment,
          citationText: fragment.slice(0, 420)
        });
      }
    }
  }

  return chunks;
}

function splitByStructure(text: string, sourceType: string) {
  const isLawLike = ["law", "cabinet_order", "ministerial_ordinance", "ordinance", "rule", "public_notice"].includes(sourceType);
  const pattern = isLawLike ? articlePattern : headingPattern;
  const matches = [...text.matchAll(pattern)];

  if (matches.length === 0) {
    return text.split(/\n{2,}/).filter(Boolean);
  }

  const parts: string[] = [];
  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index ?? 0;
    const end = matches[index + 1]?.index ?? text.length;
    parts.push(text.slice(start, end));
  }
  return parts;
}

function splitLongChunk(text: string, maxLength: number) {
  if (text.length <= maxLength) return [text];
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).trim().length > maxLength && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = `${current}\n\n${paragraph}`.trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

function extractHeading(text: string) {
  const firstLine = text.split("\n").find((line) => line.trim().length > 0)?.trim();
  if (!firstLine) return null;
  if (firstLine.length <= 80) return firstLine.replace(/^#{1,4}\s+/, "");
  const article = extractArticleNumber(firstLine);
  return article;
}
