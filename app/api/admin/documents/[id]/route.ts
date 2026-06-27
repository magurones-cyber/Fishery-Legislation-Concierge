import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { DOCUMENT_EDITOR_ROLES, requireApiAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiAuth({ roles: DOCUMENT_EDITOR_ROLES });
    if (auth.response) return auth.response;

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createServiceClient();
    const update = normalizeDocumentUpdate(body);

    const { error } = await supabase
      .from("documents")
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", auth.context.organizationId)
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json({ error: "資料の更新に失敗しました。" }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      organization_id: auth.context.organizationId,
      actor_id: auth.context.user.id,
      action: "document_update",
      target_table: "documents",
      target_id: id,
      result: "success"
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "資料更新処理でエラーが発生しました。" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiAuth({ roles: DOCUMENT_EDITOR_ROLES });
    if (auth.response) return auth.response;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "管理画面から削除";
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("documents")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: auth.context.user.id,
        delete_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("organization_id", auth.context.organizationId)
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json({ error: "資料の削除に失敗しました。" }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      organization_id: auth.context.organizationId,
      actor_id: auth.context.user.id,
      action: "document_delete",
      target_table: "documents",
      target_id: id,
      result: "success",
      metadata: { reason }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "資料削除処理でエラーが発生しました。" }, { status: 500 });
  }
}

function normalizeDocumentUpdate(body: Record<string, unknown>) {
  return {
    title: readBodyString(body, "title"),
    source_type: readBodyString(body, "sourceType"),
    legal_effect: readBodyString(body, "legalEffect"),
    issuing_authority: readBodyNullableString(body, "issuingAuthority"),
    document_number: readBodyNullableString(body, "documentNumber"),
    effective_date: readBodyNullableString(body, "effectiveDate"),
    last_amended_at: readBodyNullableString(body, "lastAmendedAt"),
    source_url: readBodyNullableString(body, "sourceUrl"),
    visibility: readBodyString(body, "visibility"),
    update_cycle: readBodyNullableString(body, "updateCycle"),
    notes: readBodyNullableString(body, "notes"),
    next_checked_at: readBodyNullableString(body, "nextCheckedAt")
  };
}

function readBodyString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function readBodyNullableString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
