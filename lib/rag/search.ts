import { createEmbedding } from "@/lib/rag/openai";
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
  const embedding = await createEmbedding(params.query);
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
