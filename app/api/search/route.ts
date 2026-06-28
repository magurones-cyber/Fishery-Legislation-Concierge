import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { audienceRoleFor, requireApiAuth } from "@/lib/auth";
import { filterActiveDocumentResults, hybridSearch, searchDocumentMetadata } from "@/lib/rag/search";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth();
    if (auth.response) return auth.response;

    const body = (await request.json()) as {
      query?: string;
      categoryId?: string;
      categoryCode?: string;
      sourceType?: string;
      tag?: string;
      issuingAuthority?: string;
    };
    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json({ error: "検索語を入力してください。" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const params = {
      query,
      organizationId: auth.context.organizationId,
      role: audienceRoleFor(auth.context),
      categoryId: body.categoryId,
      categoryCode: body.categoryCode,
      sourceType: body.sourceType,
      tag: body.tag,
      issuingAuthority: body.issuingAuthority,
      limit: 12
    } as const;

    const [chunkResults, metadataResults] = await Promise.all([
      hybridSearch(supabase, params).catch(() => []),
      searchDocumentMetadata(supabase, params)
    ]);
    const chunkDocumentIds = new Set(chunkResults.map((result) => result.document_id));
    const mergedResults = [...chunkResults, ...metadataResults.filter((result) => !chunkDocumentIds.has(result.document_id))];
    const results = (await filterActiveDocumentResults(supabase, mergedResults)).slice(0, 12);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "検索処理でエラーが発生しました。" }, { status: 500 });
  }
}
