import { redirect } from "next/navigation";
import { ADMIN_ROLES, getAuthContext, hasAnyRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await getAuthContext().catch(() => null);
  if (!context) redirect("/login");
  if (!context.hasCurrentConsent) redirect("/consent");
  if (!hasAnyRole(context, ADMIN_ROLES)) redirect("/dashboard?error=forbidden");
  return children;
}
