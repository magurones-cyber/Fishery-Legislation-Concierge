import { Shield } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userRoles } from "@/lib/phase2-data";

const accessRules = [
  ["公開資料", "全利用者"],
  ["漁協内部資料", "漁協職員以上"],
  ["自治体内部資料", "自治体職員以上"],
  ["管理資料", "管理者以上"],
  ["非公開案件", "案件担当者、関係者、管理者"]
];

export default function AdminRolesPage() {
  return (
    <AppShell title="ロール管理">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" aria-hidden />
              ロール
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userRoles.map((role) => (
              <article key={role.key} className="rounded-md border bg-background p-3 text-sm">
                <p className="font-semibold">{role.label}</p>
                <p className="mt-1 text-muted-foreground">{role.permissions.join("、")}</p>
              </article>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>アクセス制御ルール</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {accessRules.map(([target, rule]) => (
              <div key={target} className="grid grid-cols-[7rem_1fr] gap-2 rounded-md bg-muted p-3 text-sm">
                <span className="font-medium">{target}</span>
                <span className="text-muted-foreground">{rule}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
