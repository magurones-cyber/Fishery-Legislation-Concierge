import { createEmbedding } from "@/lib/rag/openai";
import type { createServiceClient } from "@/lib/supabase-admin";
import { readableVisibilityValues } from "@/lib/rag/access";
import { classifyCategoryCodes } from "@/lib/rag/classify";
import type { AudienceRole, SearchResult } from "@/lib/rag/types";

type SupabaseLike = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

export type HybridSearchParams = {
  query: string;
  organizationId: string;
  role: AudienceRole;
  categoryId?: string | null;
  categoryCode?: string | null;
  sourceType?: string | null;
  tag?: string | null;
  issuingAuthority?: string | null;
  limit?: number;
};

export async function hybridSearch(supabase: SupabaseLike, params: HybridSearchParams) {
  // Keyword/title search must remain available when the Embeddings API is unavailable.
  const embedding = await createEmbedding(params.query).catch(() => null);
  const categoryCodes = params.categoryCode ? [params.categoryCode] : classifyCategoryCodes(params.query);
  const { data, error } = await supabase.rpc("hybrid_search_document_chunks", {
    query_text: params.query,
    query_embedding: embedding,
    organization_id_input: params.organizationId,
    readable_visibilities: readableVisibilityValues(params.role),
    category_id_input: params.categoryId || null,
    category_codes_input: categoryCodes,
    source_type_input: params.sourceType || null,
    tag_input: params.tag || null,
    issuing_authority_input: params.issuingAuthority || null,
    match_count: params.limit ?? 8
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SearchResult[];
}

export async function searchDocumentMetadata(
  supabase: ReturnType<typeof createServiceClient>,
  params: HybridSearchParams
): Promise<SearchResult[]> {
  if (params.tag) return [];

  const { data, error } = await supabase
    .from("documents")
    .select("id, category_id, subcategory_id, title, source_type, document_number, issuing_authority, last_amended_at, visibility, notes, processing_status, updated_at")
    .eq("organization_id", params.organizationId)
    .in("visibility", readableVisibilityValues(params.role))
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{
    id: string;
    category_id: string | null;
    subcategory_id: string | null;
    title: string;
    source_type: string;
    document_number: string | null;
    issuing_authority: string | null;
    last_amended_at: string | null;
    visibility: SearchResult["visibility"];
    notes: string | null;
    processing_status: string;
  }>;
  const categoryIds = [...new Set(rows.flatMap((row) => [row.category_id, row.subcategory_id]).filter((id): id is string => Boolean(id)))];
  const { data: categories } = categoryIds.length > 0
    ? await supabase.from("categories").select("id, name, code").in("id", categoryIds)
    : { data: [] as Array<{ id: string; name: string; code: string }> };
  const categoryMap = new Map(((categories ?? []) as Array<{ id: string; name: string; code: string }>).map((category) => [category.id, category]));
  const query = normalizeSearchText(params.query);
  const explicitCategoryCodes = params.categoryCode ? [params.categoryCode] : [];

  return rows
    .filter((row) => {
      if (params.sourceType && row.source_type !== params.sourceType) return false;
      if (params.categoryId && row.category_id !== params.categoryId && row.subcategory_id !== params.categoryId) return false;
      if (params.issuingAuthority && !normalizeSearchText(row.issuing_authority ?? "").includes(normalizeSearchText(params.issuingAuthority))) return false;
      if (explicitCategoryCodes.length > 0) {
        const categoryCode = row.category_id ? categoryMap.get(row.category_id)?.code : null;
        const subcategoryCode = row.subcategory_id ? categoryMap.get(row.subcategory_id)?.code : null;
        if (!explicitCategoryCodes.includes(categoryCode ?? "") && !explicitCategoryCodes.includes(subcategoryCode ?? "")) return false;
      }
      return [row.title, row.document_number, row.issuing_authority].some((value) => normalizeSearchText(value ?? "").includes(query));
    })
    .slice(0, params.limit ?? 8)
    .map((row) => {
      const category = row.category_id ? categoryMap.get(row.category_id) : null;
      return {
        chunk_id: `metadata-${row.id}`,
        document_id: row.id,
        document_version_id: "",
        title: row.title,
        source_type: row.source_type,
        document_number: row.document_number,
        issuing_authority: row.issuing_authority,
        last_amended_at: row.last_amended_at,
        visibility: row.visibility,
        category_name: category?.name ?? null,
        category_code: category?.code ?? null,
        article_number: null,
        page_start: null,
        page_end: null,
        heading: "資料情報",
        content: row.notes ?? "資料名・法令番号・所管が検索語に一致しました。",
        citation_text: null,
        score: row.processing_status === "searchable" ? 0.35 : 0.25,
        result_kind: "metadata" as const,
        processing_status: row.processing_status
      };
    });
}

function normalizeSearchText(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/\s+/g, "");
}
