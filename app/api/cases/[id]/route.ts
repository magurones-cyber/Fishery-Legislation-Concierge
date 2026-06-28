import { NextResponse } from "next/server";
import { ADMIN_ROLES, requireApiAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase-admin";
import { createStorageAdapter, getAttachmentBucket } from "@/lib/storage";

export const runtime = "nodejs";

const CASE_EDITOR_ROLES = ["fisheries_coop_staff", "fisheries_coop_manager", "municipality_staff", "municipality_manager", ...ADMIN_ROLES] as const;

type DeleteBody = {
  reason?: string;
};

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth({ roles: CASE_EDITOR_ROLES });
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as DeleteBody;
  const reason = body.reason?.trim();
  if (!reason) {
    return NextResponse.json({ error: "削除理由を入力してください。" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: target, error: targetError } = await supabase
    .from("consultation_cases")
    .select("id, organization_id, title")
    .eq("id", id)
    .eq("organization_id", auth.context.organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: "相談履歴を確認できませんでした。" }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json({ error: "削除対象の相談履歴が見つかりません。" }, { status: 404 });
  }

  const { data: attachments } = await supabase.from("consultation_attachments").select("id, storage_path").eq("case_id", id);
  const storagePaths = (attachments ?? []).map((item) => item.storage_path).filter((value): value is string => Boolean(value));
  const storageWarnings: string[] = [];

  const { error: updateError } = await supabase
    .from("consultation_cases")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: auth.context.user.id,
      delete_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("organization_id", auth.context.organizationId)
    .is("deleted_at", null);

  if (updateError) {
    return NextResponse.json({ error: "相談履歴を削除できませんでした。" }, { status: 500 });
  }

  if (storagePaths.length > 0) {
    const storage = createStorageAdapter({ supabase });
    await Promise.all(
      storagePaths.map(async (path) => {
        try {
          await storage.remove({ bucket: getAttachmentBucket(), path });
        } catch (error) {
          storageWarnings.push(error instanceof Error ? error.message : `${path} の削除に失敗しました。`);
        }
      })
    );
  }

  await supabase.from("consultation_attachments").delete().eq("case_id", id);

  await supabase.from("audit_logs").insert({
    organization_id: auth.context.organizationId,
    actor_id: auth.context.user.id,
    action: "case_delete",
    target_table: "consultation_cases",
    target_id: id,
    target_case_id: id,
    reason,
    result: storageWarnings.length > 0 ? "partial_success" : "success",
    metadata_json: {
      title: target.title,
      removed_storage_paths: storagePaths,
      storage_warnings: storageWarnings
    }
  });

  return NextResponse.json({
    ok: true,
    removedStoragePaths: storagePaths.length,
    storageWarnings
  });
}
