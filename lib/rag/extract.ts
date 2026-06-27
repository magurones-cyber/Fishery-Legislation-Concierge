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

    if (isXmlFile(fileName, mime)) {
      return {
        pages: [{ pageNumber: 1, text: extractXmlText(await file.text()) }],
        status: "completed",
        errorMessage: null
      };
    }

    if (isRtfFile(fileName, mime)) {
      return {
        pages: [{ pageNumber: 1, text: extractRtfText(await file.text()) }],
        status: "completed",
        errorMessage: null
      };
    }

    if (mime === "application/pdf" || fileName.endsWith(".pdf")) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return await extractPdfText(bytes).catch((error) => fallbackExtractPdfText(bytes, error));
    }

    return {
      pages: [],
      status: "failed",
      errorMessage: "未対応のファイル形式です。PDF、TXT、Markdown、XML、RTFに対応しています。"
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

function isXmlFile(fileName: string, mime: string) {
  return fileName.endsWith(".xml") || mime === "application/xml" || mime === "text/xml";
}

function isRtfFile(fileName: string, mime: string) {
  return fileName.endsWith(".rtf") || mime === "application/rtf" || mime === "text/rtf" || mime === "application/x-rtf";
}

function extractXmlText(xml: string) {
  const withStructureBreaks = xml
    .replace(/<\?xml[\s\S]*?\?>/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "\n")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<\/(Article|Paragraph|Item|Chapter|Section|Subsection|Division|ArticleCaption|ParagraphSentence|Sentence)>/g, "\n")
    .replace(/<[^>]+>/g, " ");
  return normalizeText(decodeXmlEntities(withStructureBreaks));
}

function decodeXmlEntities(text: string) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractRtfText(rtf: string) {
  const unicodeDecoded = rtf.replace(/\\u(-?\d+)\??/g, (_match: string, code: string) => {
    const value = Number.parseInt(code, 10);
    return Number.isFinite(value) ? String.fromCharCode(value < 0 ? value + 65536 : value) : "";
  });
  const text = unicodeDecoded
    .replace(/\\'[0-9a-fA-F]{2}/g, " ")
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\line/g, "\n")
    .replace(/\\tab/g, "\t")
    .replace(/\\[a-zA-Z]+-?\d* ?/g, "")
    .replace(/[{}]/g, " ")
    .replace(/\\[~_\-]/g, " ");
  return normalizeText(text);
}

function extractionErrorCode(error: unknown) {
  if (!(error instanceof Error)) return "UNKNOWN_EXTRACTION_ERROR";
  const normalizedName = error.name.replace(/[^A-Za-z0-9_]/g, "").toUpperCase();
  return normalizedName ? `PDF_${normalizedName}` : "PDF_EXTRACTION_ERROR";
}

async function extractPdfText(bytes: Uint8Array): Promise<ExtractionResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    disableFontFace: true,
    isEvalSupported: false,
    useSystemFonts: true,
    useWorkerFetch: false
  });
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

function fallbackExtractPdfText(bytes: Uint8Array, error: unknown): ExtractionResult {
  const errorCode = extractionErrorCode(error);
  console.error("[rag:extract] PDF.js extraction failed; trying fallback", { errorCode });
  const binary = new TextDecoder("latin1").decode(bytes);
  const literalStrings = [...binary.matchAll(/\(([^()]{2,})\)\s*Tj/g)].map((match) => decodePdfLiteral(match[1] ?? ""));
  const arrayStrings = [...binary.matchAll(/\[((?:\s*\([^()]{1,}\)\s*){1,})\]\s*TJ/g)]
    .map((match) => [...(match[1] ?? "").matchAll(/\(([^()]{1,})\)/g)].map((item) => decodePdfLiteral(item[1] ?? "")).join(""));
  const text = normalizeText([...literalStrings, ...arrayStrings].join(" "));

  if (text.length > 0) {
    return {
      pages: [{ pageNumber: 1, text }],
      status: "completed",
      errorMessage: `PDF.jsでのページ単位抽出に失敗したため、簡易抽出で登録しました。（${errorCode}）`
    };
  }

  return {
    pages: [],
    status: "failed",
    errorMessage: `テキスト抽出中にエラーが発生しました。（${errorCode}）`
  };
}

function decodePdfLiteral(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}
