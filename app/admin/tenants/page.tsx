import { Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { tenantSettings } from "@/lib/phase4-data";

export default function AdminTenantsPage() {
  const organizationId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? "00000000-0000-0000-0000-000000000000";

  return (
    <AppShell title="自治体別設定">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" aria-hidden />
              テナント設定
            </CardTitle>
            <p className="text-sm text-muted-foreground">試行版では、1つの自治体又は団体を1つの組織として扱います。資料、利用者、案件、質問ログはこの組織IDで分離します。</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="space-y-1 text-sm font-medium">
              組織ID
              <Input value={organizationId} readOnly />
              <span className="block text-xs font-normal text-muted-foreground">Supabaseの `organizations.id` と一致させます。通常は初期SQLで作成した既定組織IDを使います。</span>
            </label>
            {tenantSettings.map(([label, value]) => (
              <label key={label} className="space-y-1 text-sm font-medium">
                {label}
                <Input defaultValue={value} readOnly />
              </label>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>初期設定の進め方</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Supabase SQL Editorで初期SQLを実行し、`organizations` に既定組織を作成する。</p>
            <p>2. `/admin/users` で利用者を招待し、同じ組織IDとロールを付与する。</p>
            <p>3. `/admin/documents` で資料を登録し、公開範囲を設定する。</p>
            <p>4. 複数自治体へ広げる場合は、自治体ごとに新しい `organizations.id` を発行し、資料・案件・利用者を分離する。</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
