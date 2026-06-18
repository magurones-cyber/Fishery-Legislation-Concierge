import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { CURRENT_PRIVACY_POLICY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/privacy/consent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  const body = await request.json().catch(() => null);
  const acceptedTerms = Boolean(body?.terms);
  const acceptedPrivacy = Boolean(body?.privacy);
  const acceptedAnalysis = Boolean(body?.analysis);

  if (!acceptedTerms || !acceptedPrivacy || !acceptedAnalysis) {
    return NextResponse.json({ error: "利用規約、プライバシーポリシー、質問ログ分析への同意が必要です。" }, { status: 400 });
  }

  if (!userId) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "同意履歴の保存にはログインが必要です。" }, { status: 401 });
    }
    return NextResponse.json({ ok: true, mode: "local-preview" });
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("user_consents").insert({
      user_id: userId,
      terms_version: CURRENT_TERMS_VERSION,
      privacy_policy_version: CURRENT_PRIVACY_POLICY_VERSION,
      log_analysis_consent: true,
      consent_type: "initial_login",
      consented: true,
      consented_at: new Date().toISOString()
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "同意履歴を保存できませんでした。" }, { status: 500 });
  }
}
