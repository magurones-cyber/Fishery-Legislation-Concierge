import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { DOCUMENT_EDITOR_ROLES, requireApiAuth } from "@/lib/auth";
import { chunkPages, estimateTokens } from "@/lib/rag/chunk";
import { classifyCategoryCode } from "@/lib/rag/category-classifier";
import { extractTextFromFile } from "@/lib/rag/extract";
import { createEmbedding } from "@/lib/rag/openai";
import { createStorageAdapter, getDocumentBucket } from "@/lib/storage";
import type { RagChunk } from "@/lib/rag/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type RegistrationResult = {
  documentId?: string;
  fileName: string;
  title?: string;
  status?: string;
  categoryCode?: string;
  autoCategory?: boolean;
  chunks?: number;
  embeddings?: number;
  warning?: string | null;
  error?: string;
  detail?: string;
};

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth({ roles: DOCUMENT_EDITOR_ROLES });
    if (auth.response) return auth.response;

    const formData = await request.formData();
    const files = [...formData.getAll("files"), ...formData.getAll("file")].filter(
      (value): value is File => value instanceof File && value.size > 0
    );
    if (files.length === 0) {
      return NextResponse.json({ error: "ファイルを選択してください。" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const results: RegistrationResult[] = [];
    for (const [index, file] of files.entries()) {
      results.push(
        await registerDocumentFile({
          supabase,
          formData,
          file,
          organizationId: auth.context.organizationId,
          userId: auth.context.user.id,
          index
        })
      );
    }

    if (results.length === 1) {
      const first = results[0];
      return NextResponse.json(first, { status: first.error ? 500 : 200 });
    }

    return NextResponse.json({
      status: results.every((result) => result.status === "searchable") ? "searchable" : "partial",
      total: results.length,
      succeeded: results.filter((result) => !result.error).length,
      failed: results.filter((result) => result.error).length,
      results
    });
  } catch {
    return NextResponse.json({ error: "資料登録処理でエラーが発生しました。" }, { status: 500 });
  }
}

async function registerDocumentFile({
  supabase,
  formData,
  file,
  organizationId,
  userId,
  index
}: {
  supabase: ReturnType<typeof createServiceClient>;
  formData: FormData;
  file: File;
  organizationId: string;
  userId: string;
  index: number;
}): Promise<RegistrationResult> {
  const sourceType = readString(formData, "sourceType") || "reference";
  const visibility = readString(formData, "visibility") || "admin_only";
  const tags = readString(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const explicitTitle = readString(formData, "title");
  const title = filesafeTitle(explicitTitle && index === 0 ? explicitTitle : file.name);
  const storagePath = `${organizationId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const storage = createStorageAdapter({ supabase });

  let storedObject: { path: string };
  try {
    storedObject = await storage.upload({
      bucket: getDocumentBucket(),
      path: storagePath,
      file,
      contentType: file.type || "application/octet-stream",
      upsert: false
    });
  } catch (error) {
    return { fileName: file.name, error: "Storageへの保存に失敗しました。", detail: error instanceof Error ? error.message : undefined };
  }

  const extraction = await extractTextFromFile(file);
  const extractedPreview = extraction.pages.map((page) => page.text).join("\n").slice(0, 8000);
  const requestedCategoryCode = readString(formData, "categoryCode");
  const autoCategory = readString(formData, "categoryMode") === "auto" || !requestedCategoryCode;
  const categoryCode = autoCategory ? classifyCategoryCode(`${title}\n${extractedPreview}`, requestedCategoryCode || "99") : requestedCategoryCode;
  const categoryId = readString(formData, "categoryId") || (await resolveCategoryId(supabase, organizationId, categoryCode));
  const subcategoryId = readString(formData, "subcategoryId") || (await resolveCategoryId(supabase, organizationId, readString(formData, "subcategoryCode")));

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .insert({
      organization_id: organizationId,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      title,
      source_type: sourceType,
      legal_effect: readString(formData, "legalEffect") || legalEffectFor(sourceType),
      issuing_authority: readString(formData, "issuingAuthority") || null,
      document_number: readString(formData, "documentNumber") || null,
      effective_date: readString(formData, "effectiveDate") || null,
      last_amended_at: readString(formData, "lastAmendedAt") || null,
      acquired_at: readString(formData, "acquiredAt") || new Date().toISOString().slice(0, 10),
      source_url: readString(formData, "sourceUrl") || null,
      visibility,
      update_cycle: readString(formData, "updateCycle") || null,
      notes: readString(formData, "notes") || null,
      file_format: detectFileFormat(file),
      storage_path: storedObject.path,
      processing_status: "processing",
      created_by: userId
    })
    .select("id")
    .single();

  if (documentError || !document) {
    return { fileName: file.name, error: "資料メタデータの登録に失敗しました。", detail: documentError?.message };
  }

  const extractedChunks = extraction.status === "completed" ? chunkPages(extraction.pages, sourceType) : [];
  const chunks = extractedChunks.length > 0
    ? extractedChunks
    : [
        buildMetadataChunk({
          title,
          sourceType,
          legalEffect: readString(formData, "legalEffect") || legalEffectFor(sourceType),
          documentNumber: readString(formData, "documentNumber"),
          issuingAuthority: readString(formData, "issuingAuthority"),
          notes: readString(formData, "notes"),
          extractionMessage: extraction.errorMessage
        })
      ];
  const { data: version, error: versionError } = await supabase
    .from("document_versions")
    .insert({
      document_id: document.id,
      version_label: "初版",
      storage_path: storedObject.path,
      page_count: extraction.pages.length,
      change_summary: "資料登録",
      created_by: userId
    })
    .select("id")
    .single();

  if (versionError || !version) {
    return { documentId: document.id, fileName: file.name, error: "資料バージョンの登録に失敗しました。", detail: versionError?.message };
  }

  let embeddedCount = 0;
  let embeddingFailed = false;
  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk.content).catch(() => {
      embeddingFailed = true;
      return null;
    });
    const { error: chunkError } = await supabase.from("document_chunks").insert({
      document_version_id: version.id,
      document_id: document.id,
      chunk_index: chunk.chunkIndex,
      page_start: chunk.pageStart,
      page_end: chunk.pageEnd,
      article_number: chunk.articleNumber,
      heading: chunk.heading,
      content: chunk.content,
      citation_text: chunk.citationText,
      token_count: estimateTokens(chunk.content),
      embedding
    });
    if (chunkError) {
      await supabase
        .from("documents")
        .update({ processing_status: "failed", processing_error: "チャンク保存に失敗しました。", processed_at: new Date().toISOString() })
        .eq("id", document.id);
      return { documentId: document.id, fileName: file.name, error: "チャンク保存に失敗しました。", detail: chunkError.message };
    }
    if (embedding) embeddedCount += 1;
  }

  await upsertTags(supabase, organizationId, document.id, tags);

  const finalStatus = chunks.length > 0 ? "searchable" : extraction.status;
  const processingWarning = extraction.errorMessage
    ?? (extractedChunks.length === 0 ? "本文を抽出できませんでした。資料情報のみ検索対象として登録しました。本文検索にはOCR、XML/RTF/TXT、又はテキスト抽出可能なPDFでの再登録が必要です。" : null)
    ?? (embeddingFailed ? "Embedding生成に失敗しました。キーワード検索は利用できます。" : null);
  await supabase
    .from("documents")
    .update({
      category_id: categoryId,
      subcategory_id: subcategoryId,
      processing_status: finalStatus,
      processing_error: processingWarning,
      processed_at: new Date().toISOString()
    })
    .eq("id", document.id);

  await supabase
    .from("document_versions")
    .update({ extraction_status: finalStatus, extraction_error: processingWarning })
    .eq("id", version.id);

  return {
    documentId: document.id,
    fileName: file.name,
    title,
    status: finalStatus,
    categoryCode,
    autoCategory,
    chunks: chunks.length,
    embeddings: embeddedCount,
    warning: processingWarning
  };
}

function buildMetadataChunk({
  title,
  sourceType,
  legalEffect,
  documentNumber,
  issuingAuthority,
  notes,
  extractionMessage
}: {
  title: string;
  sourceType: string;
  legalEffect: string;
  documentNumber: string;
  issuingAuthority: string;
  notes: string;
  extractionMessage: string | null;
}): RagChunk {
  const content = [
    "資料情報（本文未抽出）",
    `資料名: ${title}`,
    `資料種別: ${sourceType}`,
    documentNumber ? `法令番号: ${documentNumber}` : "",
    issuingAuthority ? `所管: ${issuingAuthority}` : "",
    `法的効力: ${legalEffect}`,
    notes ? `備考: ${notes}` : "",
    extractionMessage ? `処理メモ: ${extractionMessage}` : "処理メモ: 本文を抽出できなかったため、資料情報のみを検索対象にしています。"
  ]
    .filter(Boolean)
    .join("\n");

  return {
    chunkIndex: 0,
    pageStart: 1,
    pageEnd: 1,
    articleNumber: null,
    heading: "資料情報（本文未抽出）",
    content,
    citationText: "本文は未抽出です。根拠確認は原本ファイルを開いて行ってください。"
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-]+/g, "_");
}

function filesafeTitle(title: string) {
  return title.replace(/\.[^.]+$/, "").trim() || "無題の資料";
}

function legalEffectFor(sourceType: string) {
  if (["law", "cabinet_order", "ministerial_ordinance", "ordinance", "rule"].includes(sourceType)) return "法令・条例等。条文の明確な記載を優先する。";
  if (["public_notice", "notification", "guideline", "outline", "procedure_manual"].includes(sourceType)) return "告示、通知、ガイドライン、要綱・要領。上位法令と併せて確認する。";
  return "業務資料。法令解釈の根拠は関連法令を併記すること。";
}

function detectFileFormat(file: File) {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "markdown";
  if (file.type === "application/xml" || file.type === "text/xml" || name.endsWith(".xml")) return "xml";
  if (file.type === "application/rtf" || file.type === "text/rtf" || file.type === "application/x-rtf" || name.endsWith(".rtf")) return "rtf";
  if (file.type === "text/plain" || name.endsWith(".txt")) return "txt";
  return "unknown";
}

async function upsertTags(
  supabase: ReturnType<typeof createServiceClient>,
  organizationId: string,
  documentId: string,
  tags: string[]
) {
  for (const name of tags) {
    const { data: tag } = await supabase
      .from("tags")
      .upsert({ organization_id: organizationId, name }, { onConflict: "organization_id,name" })
      .select("id")
      .single();
    if (tag) {
      await supabase.from("document_tags").upsert({ document_id: documentId, tag_id: tag.id });
    }
  }
}

async function resolveCategoryId(supabase: ReturnType<typeof createServiceClient>, organizationId: string, code: string) {
  if (!code) return null;
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("code", code)
    .maybeSingle();
  return data?.id ?? null;
}
