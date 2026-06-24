import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createStorageAdapter, getDocumentBucket } from "@/lib/storage";
import type { Visibility } from "@/lib/rag/types";

export type DocumentSummary = {
  id: string;
  title: string;
  sourceType: string;
  legalEffect: string;
  issuingAuthority: string | null;
  documentNumber: string | null;
  effectiveDate: string | null;
  lastAmendedAt: string | null;
  updatedAt: string;
  visibility: Visibility;
  processingStatus: string;
  processingError: string | null;
  fileFormat: string | null;
  storagePath: string | null;
  notes: string | null;
  categoryName: string | null;
  categoryCode: string | null;
  pageCount: number | null;
  nextCheckedAt: string | null;
};

export type DocumentChunkSummary = {
  id: string;
  articleNumber: string | null;
  heading: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  content: string;
  citationText: string | null;
};

type DocumentRow = {
  id: string;
  category_id: string | null;
  title: string;
  source_type: string;
  legal_effect: string;
  issuing_authority: string | null;
  document_number: string | null;
  effective_date: string | null;
  last_amended_at: string | null;
  updated_at: string;
  visibility: Visibility;
  processing_status: string;
  processing_error: string | null;
  file_format: string | null;
  storage_path: string | null;
  notes: string | null;
  next_checked_at: string | null;
};

type CategoryRow = { id: string; name: string; code: string };
type VersionRow = { document_id: string; page_count: number | null; created_at: string };

const documentFields = [
  "id",
  "category_id",
  "title",
  "source_type",
  "legal_effect",
  "issuing_authority",
  "document_number",
  "effective_date",
  "last_amended_at",
  "updated_at",
  "visibility",
  "processing_status",
  "processing_error",
  "file_format",
  "storage_path",
  "notes",
  "next_checked_at"
].join(",");

export async function listReadableDocuments(): Promise<{ documents: DocumentSummary[]; error: string | null }> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("documents").select(documentFields).order("updated_at", { ascending: false }).limit(200);
  if (error) return { documents: [], error: "登録資料を読み込めませんでした。" };

  const rows = (data ?? []) as unknown as DocumentRow[];
  return { documents: await enrichDocuments(supabase, rows), error: null };
}

export async function getReadableDocument(id: string): Promise<{
  document: DocumentSummary | null;
  chunks: DocumentChunkSummary[];
  fileUrl: string | null;
}> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("documents").select(documentFields).eq("id", id).maybeSingle();
  if (!data) return { document: null, chunks: [], fileUrl: null };

  const [document] = await enrichDocuments(supabase, [data as unknown as DocumentRow]);
  const { data: chunkRows } = await supabase
    .from("document_chunks")
    .select("id, article_number, heading, page_start, page_end, content, citation_text")
    .eq("document_id", id)
    .order("chunk_index", { ascending: true })
    .limit(100);

  const chunks = ((chunkRows ?? []) as Array<{
    id: string;
    article_number: string | null;
    heading: string | null;
    page_start: number | null;
    page_end: number | null;
    content: string;
    citation_text: string | null;
  }>).map((chunk) => ({
    id: chunk.id,
    articleNumber: chunk.article_number,
    heading: chunk.heading,
    pageStart: chunk.page_start,
    pageEnd: chunk.page_end,
    content: chunk.content,
    citationText: chunk.citation_text
  }));

  let fileUrl: string | null = null;
  if (document.storagePath) {
    try {
      fileUrl = await createStorageAdapter({ supabase }).getSignedUrl({
        bucket: getDocumentBucket(),
        path: document.storagePath,
        expiresInSeconds: 300
      });
    } catch {
      fileUrl = null;
    }
  }

  return { document, chunks, fileUrl };
}

async function enrichDocuments(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  rows: DocumentRow[]
): Promise<DocumentSummary[]> {
  if (rows.length === 0) return [];
  const categoryIds = [...new Set(rows.map((row) => row.category_id).filter((id): id is string => Boolean(id)))];
  const documentIds = rows.map((row) => row.id);

  const [{ data: categoryData }, { data: versionData }] = await Promise.all([
    categoryIds.length > 0 ? supabase.from("categories").select("id, name, code").in("id", categoryIds) : Promise.resolve({ data: [] }),
    supabase
      .from("document_versions")
      .select("document_id, page_count, created_at")
      .in("document_id", documentIds)
      .order("created_at", { ascending: false })
  ]);

  const categoryMap = new Map(((categoryData ?? []) as CategoryRow[]).map((category) => [category.id, category]));
  const pageCountMap = new Map<string, number | null>();
  for (const version of (versionData ?? []) as VersionRow[]) {
    if (!pageCountMap.has(version.document_id)) pageCountMap.set(version.document_id, version.page_count);
  }

  return rows.map((row) => {
    const category = row.category_id ? categoryMap.get(row.category_id) : null;
    return {
      id: row.id,
      title: row.title,
      sourceType: row.source_type,
      legalEffect: row.legal_effect,
      issuingAuthority: row.issuing_authority,
      documentNumber: row.document_number,
      effectiveDate: row.effective_date,
      lastAmendedAt: row.last_amended_at,
      updatedAt: row.updated_at,
      visibility: row.visibility,
      processingStatus: row.processing_status,
      processingError: row.processing_error,
      fileFormat: row.file_format,
      storagePath: row.storage_path,
      notes: row.notes,
      categoryName: category?.name ?? null,
      categoryCode: category?.code ?? null,
      pageCount: pageCountMap.get(row.id) ?? null,
      nextCheckedAt: row.next_checked_at
    };
  });
}
