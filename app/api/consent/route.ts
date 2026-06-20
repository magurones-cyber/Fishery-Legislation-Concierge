import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CURRENT_PRIVACY_POLICY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/privacy/consent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const acceptedTerms = Boolean(body?.terms);
  const acceptedPrivacy = Boolean(body?.privacy);
  const acceptedAnalysis = Boolean(body?.analysis);

  if (!acceptedTerms || !acceptedPrivacy || !acceptedAnalysis) {
    return NextResponse.json({ error: "利用規約、プライバシーポリシー、質問ログ分析への同意が必要です。" }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: "同意履歴の保存にはログインが必要です。" }, { status: 401 });

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const { error } = await supabase.from("user_consents").insert({
      user_id: data.user.id,
      terms_version: CURRENT_TERMS_VERSION,
      privacy_policy_version: CURRENT_PRIVACY_POLICY_VERSION,
      log_analysis_consent: true,
      consent_type: "initial_login",
      consented: true,
      consented_at: new Date().toISOString(),
      ip_address: forwardedFor || null,
      user_agent: request.headers.get("user-agent")
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "同意履歴を保存できませんでした。" }, { status: 500 });
  }
}
