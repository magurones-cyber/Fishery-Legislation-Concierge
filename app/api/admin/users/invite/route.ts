import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { ADMIN_ROLES, hasAnyRole, requireApiAuth } from "@/lib/auth";

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
  const auth = await requireApiAuth({ roles: ADMIN_ROLES });
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const requestedOrganizationId = typeof body?.organizationId === "string" ? body.organizationId.trim() : "";
  const organizationId = hasAnyRole(auth.context, ["super_admin"]) && requestedOrganizationId ? requestedOrganizationId : auth.context.organizationId;
  const role = typeof body?.role === "string" ? body.role : "";

  if (!email || !displayName || !organizationId || !allowedRoles.has(role)) {
    return NextResponse.json({ error: "メール、表示名、organization、ロールを確認してください。" }, { status: 400 });
  }
  if (role === "system_admin" && !hasAnyRole(auth.context, ["system_admin", "super_admin"])) {
    return NextResponse.json({ error: "システム管理者を付与する権限がありません。" }, { status: 403 });
  }

  try {
    const supabase = createServiceClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const invite = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        display_name: displayName,
        organization_id: organizationId,
        role
      },
      redirectTo: `${appUrl}/auth/callback?next=/auth/set-password`
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
      actor_id: auth.context.user.id,
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
