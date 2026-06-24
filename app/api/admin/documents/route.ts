import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { DOCUMENT_EDITOR_ROLES, requireApiAuth } from "@/lib/auth";
import { chunkPages, estimateTokens } from "@/lib/rag/chunk";
import { extractTextFromFile } from "@/lib/rag/extract";
import { createEmbedding } from "@/lib/rag/openai";
import { createStorageAdapter, getDocumentBucket } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth({ roles: DOCUMENT_EDITOR_ROLES });
    if (auth.response) return auth.response;

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "ファイルを選択してください。" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const organizationId = auth.context.organizationId;
    const title = readString(formData, "title") || file.name;
    const categoryId = readString(formData, "categoryId") || (await resolveCategoryId(supabase, organizationId, readString(formData, "categoryCode")));
    const subcategoryId = readString(formData, "subcategoryId") || (await resolveCategoryId(supabase, organizationId, readString(formData, "subcategoryCode")));
    const sourceType = readString(formData, "sourceType") || "reference";
    const visibility = readString(formData, "visibility") || "admin_only";
    const tags = readString(formData, "tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const storagePath = `${organizationId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

    const storage = createStorageAdapter({ supabase });
    let storedObject;
    try {
      storedObject = await storage.upload({
        bucket: getDocumentBucket(),
        path: storagePath,
        file,
        contentType: file.type || "application/octet-stream",
        upsert: false
      });
    } catch (error) {
      return NextResponse.json({ error: "Storageへの保存に失敗しました。", detail: error instanceof Error ? error.message : undefined }, { status: 500 });
    }

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
        processing_status: "processing"
      })
      .select("id")
      .single();

    if (documentError || !document) {
      return NextResponse.json({ error: "資料メタデータの登録に失敗しました。", detail: documentError?.message }, { status: 500 });
    }

    const extraction = await extractTextFromFile(file);
    const chunks = extraction.status === "completed" ? chunkPages(extraction.pages, sourceType) : [];

    const { data: version, error: versionError } = await supabase
      .from("document_versions")
      .insert({
        document_id: document.id,
        version_label: "初版",
        storage_path: storedObject.path,
        page_count: extraction.pages.length,
        change_summary: "Phase 1 資料登録"
      })
      .select("id")
      .single();

    if (versionError || !version) {
      return NextResponse.json({ error: "資料バージョンの登録に失敗しました。", detail: versionError?.message }, { status: 500 });
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
        return NextResponse.json({ error: "チャンク保存に失敗しました。", detail: chunkError.message }, { status: 500 });
      }
      if (embedding) embeddedCount += 1;
    }

    await upsertTags(supabase, organizationId, document.id, tags);

    const finalStatus = extraction.status === "completed" && chunks.length > 0 ? "searchable" : extraction.status === "completed" ? "failed" : extraction.status;
    const processingWarning = extraction.errorMessage
      ?? (chunks.length === 0 ? "本文を抽出できませんでした。資料情報と原本のみ登録されています。" : null)
      ?? (embeddingFailed ? "Embedding生成に失敗しました。キーワード検索は利用できます。" : null);
    await supabase
      .from("documents")
      .update({
        processing_status: finalStatus,
        processing_error: processingWarning,
        processed_at: new Date().toISOString()
      })
      .eq("id", document.id);

    await supabase
      .from("document_versions")
      .update({ extraction_status: finalStatus, extraction_error: processingWarning })
      .eq("id", version.id);

    return NextResponse.json({
      documentId: document.id,
      status: finalStatus,
      chunks: chunks.length,
      embeddings: embeddedCount,
      warning: processingWarning
    });
  } catch {
    return NextResponse.json({ error: "資料登録処理でエラーが発生しました。" }, { status: 500 });
  }
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-]+/g, "_");
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
