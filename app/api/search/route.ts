import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { audienceRoleFor, requireApiAuth } from "@/lib/auth";
import { hybridSearch } from "@/lib/rag/search";

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

    const results = await hybridSearch(createServiceClient(), {
      query,
      organizationId: auth.context.organizationId,
      role: audienceRoleFor(auth.context),
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
