import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { DOCUMENT_EDITOR_ROLES, requireApiAuth } from "@/lib/auth";
import { createStorageAdapter, getDocumentBucket } from "@/lib/storage";

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

    const { data: document, error: findError } = await supabase
      .from("documents")
      .select("id, storage_path")
      .eq("id", id)
      .eq("organization_id", auth.context.organizationId)
      .is("deleted_at", null)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: "削除対象の確認に失敗しました。" }, { status: 500 });
    }

    if (!document) {
      return NextResponse.json({ error: "削除対象の資料が見つかりません。" }, { status: 404 });
    }

    const { data: versions } = await supabase
      .from("document_versions")
      .select("storage_path")
      .eq("document_id", id);

    const storagePaths = uniqueStoragePaths([
      document.storage_path,
      ...((versions ?? []) as Array<{ storage_path: string | null }>).map((version) => version.storage_path)
    ]);

    const { error } = await supabase
      .from("documents")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: auth.context.user.id,
        delete_reason: reason,
        storage_path: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("organization_id", auth.context.organizationId)
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json({ error: "資料の削除に失敗しました。" }, { status: 500 });
    }

    const { error: chunkDeleteError } = await supabase.from("document_chunks").delete().eq("document_id", id);
    if (chunkDeleteError) {
      return NextResponse.json({ error: "検索用チャンクの削除に失敗しました。" }, { status: 500 });
    }

    await supabase.from("document_versions").update({ storage_path: null }).eq("document_id", id);

    const storageWarnings = await removeOriginalFiles(supabase, storagePaths);

    await supabase.from("audit_logs").insert({
      organization_id: auth.context.organizationId,
      actor_id: auth.context.user.id,
      action: "document_delete",
      target_table: "documents",
      target_id: id,
      result: "success",
      metadata: { reason, removed_storage_paths: storagePaths.length, storage_warnings: storageWarnings }
    });

    return NextResponse.json({ ok: true, removedStorageFiles: storagePaths.length, storageWarnings });
  } catch {
    return NextResponse.json({ error: "資料削除処理でエラーが発生しました。" }, { status: 500 });
  }
}

async function removeOriginalFiles(supabase: ReturnType<typeof createServiceClient>, storagePaths: string[]) {
  if (storagePaths.length === 0) return [];
  const storage = createStorageAdapter({ supabase });
  const results = await Promise.allSettled(
    storagePaths.map((path) =>
      storage.remove({
        bucket: getDocumentBucket(),
        path
      })
    )
  );

  return results
    .map((result, index) => {
      if (result.status === "fulfilled") return null;
      return {
        path: storagePaths[index],
        message: result.reason instanceof Error ? result.reason.message : "Storage原本の削除に失敗しました。"
      };
    })
    .filter((warning): warning is { path: string; message: string } => Boolean(warning));
}

function uniqueStoragePaths(paths: Array<string | null | undefined>) {
  return [...new Set(paths.filter((path): path is string => Boolean(path && path.trim())))];
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
