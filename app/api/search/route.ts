import { NextResponse } from "next/server";
import { createServiceClient, getDefaultOrganizationId } from "@/lib/supabase-admin";
import { hybridSearch } from "@/lib/rag/search";
import type { AudienceRole } from "@/lib/rag/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      query?: string;
      role?: AudienceRole;
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

    const results = await hybridSearch(createServiceClient(), {
      query,
      organizationId: getDefaultOrganizationId(),
      role: body.role ?? "public",
      categoryId: body.categoryId,
      categoryCode: body.categoryCode,
      sourceType: body.sourceType,
      tag: body.tag,
      issuingAuthority: body.issuingAuthority,
      limit: 12
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "検索処理でエラーが発生しました。" }, { status: 500 });
  }
}
