import { Shield } from "lucide-react";
import { UserInviteForm } from "@/components/admin/user-invite-form";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userRoles } from "@/lib/phase2-data";

export default function AdminUsersPage() {
  return (
    <AppShell title="ユーザー管理">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>ユーザー招待</CardTitle>
            <p className="text-sm text-muted-foreground">自由サインアップは使わず、管理者が招待し、所属organizationとロールを付与します。</p>
          </CardHeader>
          <CardContent>
            <UserInviteForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" aria-hidden />
              ロール別権限
            </CardTitle>
            <p className="text-sm text-muted-foreground">Supabase Auth、roles、user_roles、RLSを組み合わせ、自治体・所属・役割で制御します。</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {userRoles.map((role) => (
              <div key={role.key} className="rounded-md border bg-background p-3 text-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-semibold">{role.label}</span>
                  <span className="rounded-sm bg-muted px-2 py-1 text-xs">{role.key}</span>
                </div>
                <p className="text-muted-foreground">{role.permissions.join("、")}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
