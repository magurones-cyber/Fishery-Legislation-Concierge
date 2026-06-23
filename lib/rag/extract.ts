import type { ExtractedPage } from "@/lib/rag/types";
import { normalizeText } from "@/lib/rag/chunk";

export type ExtractionResult = {
  pages: ExtractedPage[];
  status: "completed" | "ocr_required" | "failed";
  errorMessage: string | null;
};

export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  const fileName = file.name.toLowerCase();
  const mime = file.type;

  try {
    if (mime === "text/plain" || fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".markdown")) {
      return {
        pages: [{ pageNumber: 1, text: normalizeText(await file.text()) }],
        status: "completed",
        errorMessage: null
      };
    }

    if (mime === "application/pdf" || fileName.endsWith(".pdf")) {
      return await extractPdfText(file);
    }

    return {
      pages: [],
      status: "failed",
      errorMessage: "未対応のファイル形式です。Phase 1 は PDF、TXT、Markdown に対応しています。"
    };
  } catch (error) {
    const errorCode = extractionErrorCode(error);
    console.error("[rag:extract] PDF/text extraction failed", { errorCode });
    return {
      pages: [],
      status: "failed",
      errorMessage: `テキスト抽出中にエラーが発生しました。（${errorCode}）`
    };
  }
}

function extractionErrorCode(error: unknown) {
  if (!(error instanceof Error)) return "UNKNOWN_EXTRACTION_ERROR";
  const normalizedName = error.name.replace(/[^A-Za-z0-9_]/g, "").toUpperCase();
  return normalizedName ? `PDF_${normalizedName}` : "PDF_EXTRACTION_ERROR";
}

async function extractPdfText(file: File): Promise<ExtractionResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data: bytes, useWorkerFetch: false, isEvalSupported: false });
  const pdf = await loadingTask.promise;
  const pages: ExtractedPage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push({ pageNumber, text: normalizeText(text) });
  }

  const totalTextLength = pages.reduce((sum, page) => sum + page.text.length, 0);
  return {
    pages,
    status: totalTextLength > 0 ? "completed" : "ocr_required",
    errorMessage: totalTextLength > 0 ? null : "PDFからテキストを抽出できませんでした。OCR未処理として登録しました。"
  };
}
