import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const allowedRoles = new Set([
  "general_user",
  "fisheries_coop_staff",
  "fisheries_coop_manager",
  "municipality_staff",
  "municipality_manager",
  "admin",
  "system_admin"
]);

export async function POST(request: Request) {
  const guard = assertAdminInviteRequest(request);
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const organizationId = typeof body?.organizationId === "string" ? body.organizationId.trim() : "";
  const role = typeof body?.role === "string" ? body.role : "";

  if (!email || !displayName || !organizationId || !allowedRoles.has(role)) {
    return NextResponse.json({ error: "メール、表示名、organization、ロールを確認してください。" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const invite = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        display_name: displayName,
        organization_id: organizationId,
        role
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/consent`
    });
    if (invite.error || !invite.data.user) throw invite.error ?? new Error("invite failed");

    const userId = invite.data.user.id;
    await supabase.from("users").upsert({
      id: userId,
      organization_id: organizationId,
      display_name: displayName,
      email,
      is_active: true
    });
    await supabase.from("user_organizations").upsert({
      user_id: userId,
      organization_id: organizationId,
      role_in_organization: role
    });
    const { data: roleRecord } = await supabase.from("roles").select("id").eq("name", role).maybeSingle();
    if (roleRecord?.id) {
      await supabase.from("user_roles").upsert({
        user_id: userId,
        role_id: roleRecord.id,
        organization_id: organizationId
      });
    }

    await supabase.from("audit_logs").insert({
      organization_id: organizationId,
      action: "user_invite",
      target_table: "users",
      target_id: userId,
      metadata_json: { email, role }
    });

    return NextResponse.json({ ok: true, userId });
  } catch {
    return NextResponse.json({ error: "ユーザー招待に失敗しました。Supabase Auth設定とsecret keyを確認してください。" }, { status: 500 });
  }
}

function assertAdminInviteRequest(request: Request) {
  const expectedToken = process.env.ADMIN_INVITE_TOKEN ?? process.env.ADMIN_UPLOAD_TOKEN;
  const isProduction = process.env.NODE_ENV === "production";

  if (!expectedToken && isProduction) {
    return NextResponse.json({ error: "本番環境のユーザー招待には ADMIN_INVITE_TOKEN の設定が必要です。" }, { status: 503 });
  }
  if (!expectedToken) return null;

  const actualToken = request.headers.get("x-admin-invite-token");
  if (actualToken !== expectedToken) {
    return NextResponse.json({ error: "ユーザー招待権限を確認できません。" }, { status: 401 });
  }
  return null;
}
