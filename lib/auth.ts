import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { CURRENT_PRIVACY_POLICY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/privacy/consent";
import type { AudienceRole } from "@/lib/rag/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const ADMIN_ROLES = ["admin", "system_admin", "super_admin"] as const;
export const DOCUMENT_EDITOR_ROLES = ["editor", ...ADMIN_ROLES] as const;
export const QUESTION_LOG_ADMIN_ROLES = ["fisheries_coop_manager", "municipality_manager", ...ADMIN_ROLES] as const;

export type AuthContext = {
  user: User;
  organizationId: string;
  displayName: string;
  roles: string[];
  hasCurrentConsent: boolean;
};

type ProfileRow = {
  organization_id: string | null;
  display_name: string | null;
  is_active: boolean | null;
};

type RoleRow = {
  roles: { name: string } | Array<{ name: string }> | null;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) return null;

  const [{ data: profileData }, { data: roleData }, { data: consentData }] = await Promise.all([
    supabase.from("users").select("organization_id, display_name, is_active").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("roles(name)").eq("user_id", user.id),
    supabase
      .from("user_consents")
      .select("id")
      .eq("user_id", user.id)
      .eq("terms_version", CURRENT_TERMS_VERSION)
      .eq("privacy_policy_version", CURRENT_PRIVACY_POLICY_VERSION)
      .eq("log_analysis_consent", true)
      .eq("consented", true)
      .is("revoked_at", null)
      .limit(1)
      .maybeSingle()
  ]);

  const profile = profileData as ProfileRow | null;
  if (!profile?.organization_id || profile.is_active === false) return null;

  const roles = ((roleData ?? []) as unknown as RoleRow[])
    .flatMap((row) => (Array.isArray(row.roles) ? row.roles : row.roles ? [row.roles] : []))
    .map((role) => role.name);

  return {
    user,
    organizationId: profile.organization_id,
    displayName: profile.display_name ?? user.email ?? "利用者",
    roles,
    hasCurrentConsent: Boolean(consentData)
  };
}

export function hasAnyRole(context: AuthContext, allowedRoles: readonly string[]) {
  return context.roles.some((role) => allowedRoles.includes(role));
}

export function audienceRoleFor(context: AuthContext): AudienceRole {
  if (hasAnyRole(context, ["admin", "system_admin", "super_admin", "editor"])) return "admin";
  if (hasAnyRole(context, ["municipality_staff", "municipality_manager"])) return "municipality_staff";
  if (hasAnyRole(context, ["fisheries_coop_staff", "fisheries_coop_manager"])) return "fisheries_coop_staff";
  return "public";
}

export async function requireApiAuth(options?: { roles?: readonly string[]; requireConsent?: boolean }) {
  const context = await getAuthContext().catch(() => null);
  if (!context) {
    return { context: null, response: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }) } as const;
  }
  if (options?.requireConsent !== false && !context.hasCurrentConsent) {
    return { context: null, response: NextResponse.json({ error: "初回同意が必要です。", consentRequired: true }, { status: 403 }) } as const;
  }
  if (options?.roles && !hasAnyRole(context, options.roles)) {
    return { context: null, response: NextResponse.json({ error: "この操作を行う権限がありません。" }, { status: 403 }) } as const;
  }
  return { context, response: null } as const;
}
