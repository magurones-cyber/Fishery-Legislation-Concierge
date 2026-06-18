import { NextResponse } from "next/server";
import { createServiceClient, getDefaultOrganizationId } from "@/lib/supabase-admin";
import { findIndividualQuestionLog, questionLogAccessReasons } from "@/lib/question-log-analytics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const guard = assertAdminLogAccessRequest(request);
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const logId = typeof body?.logId === "string" ? body.logId : "";
  const reason = typeof body?.reason === "string" ? body.reason : "";
  const detail = typeof body?.detail === "string" ? body.detail.trim() : "";

  if (!logId) return NextResponse.json({ error: "ログIDが必要です。" }, { status: 400 });
  if (!questionLogAccessReasons.includes(reason as never)) return NextResponse.json({ error: "閲覧理由を選択してください。" }, { status: 400 });
  if (reason === "その他" && !detail) return NextResponse.json({ error: "その他の場合は補足理由を入力してください。" }, { status: 400 });

  try {
    const supabase = createServiceClient();
    await supabase.from("audit_logs").insert({
      organization_id: getDefaultOrganizationId(),
      action: "question_log_detail_view",
      target_table: "qa_sessions",
      reason,
      metadata_json: {
        log_id: logId,
        detail: detail || null,
        privacy_scope: "individual_question_log"
      }
    });
  } catch {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "監査ログを保存できないため、個別ログを閲覧できません。" }, { status: 503 });
    }
  }

  const log = findIndividualQuestionLog(logId);
  if (!log) return NextResponse.json({ error: "対象ログが見つかりません。" }, { status: 404 });

  return NextResponse.json({ ok: true, log });
}

function assertAdminLogAccessRequest(request: Request) {
  const expectedToken = process.env.ADMIN_LOG_ACCESS_TOKEN;
  const isProduction = process.env.NODE_ENV === "production";

  if (!expectedToken && isProduction) {
    return NextResponse.json({ error: "本番環境の個別質問ログ閲覧には ADMIN_LOG_ACCESS_TOKEN 又はSupabase Auth接続が必要です。" }, { status: 503 });
  }

  if (!expectedToken) return null;

  const actualToken = request.headers.get("x-admin-log-access-token");
  if (actualToken !== expectedToken) {
    return NextResponse.json({ error: "個別質問ログの閲覧権限を確認できません。" }, { status: 401 });
  }

  return null;
}
