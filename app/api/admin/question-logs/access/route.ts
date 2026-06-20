import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { QUESTION_LOG_ADMIN_ROLES, requireApiAuth } from "@/lib/auth";
import { findIndividualQuestionLog, questionLogAccessReasons } from "@/lib/question-log-analytics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireApiAuth({ roles: QUESTION_LOG_ADMIN_ROLES });
  if (auth.response) return auth.response;

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
      organization_id: auth.context.organizationId,
      actor_id: auth.context.user.id,
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
    return NextResponse.json({ error: "監査ログを保存できないため、個別ログを閲覧できません。" }, { status: 503 });
  }

  const log = findIndividualQuestionLog(logId);
  if (!log) return NextResponse.json({ error: "対象ログが見つかりません。" }, { status: 404 });

  return NextResponse.json({ ok: true, log });
}
