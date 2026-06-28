import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { buildCasePayload, CASE_EDITOR_ROLES } from "@/lib/case-payload";
import { createServiceClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireApiAuth({ roles: CASE_EDITOR_ROLES });
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const payload = buildCasePayload(body, auth.context.organizationId);
  if (!payload.title) {
    return NextResponse.json({ error: "件名を入力してください。" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("consultation_cases")
    .insert({ ...payload, created_by: auth.context.user.id })
    .select("id")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "相談履歴を保存できませんでした。" }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    organization_id: auth.context.organizationId,
    actor_id: auth.context.user.id,
    action: "case_create",
    target_table: "consultation_cases",
    target_id: data.id,
    target_case_id: data.id,
    result: "success",
    metadata_json: { title: payload.title, status_label: payload.status_label }
  });

  return NextResponse.json({ id: data.id });
}
