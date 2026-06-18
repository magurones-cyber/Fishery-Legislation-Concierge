import { Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tenantSettings } from "@/lib/phase4-data";

export default function AdminTenantsPage() {
  return (
    <AppShell title="自治体別設定">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" aria-hidden />
              テナント設定
            </CardTitle>
            <p className="text-sm text-muted-foreground">既存データは現在の `organization_id` を維持し、追加自治体は新しい組織IDで分離します。</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {tenantSettings.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[6rem_1fr] gap-2 rounded-md bg-muted p-3 text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>移行方針</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. 既存レコードの `organization_id` をデモ自治体IDとして固定する。</p>
            <p>2. 新規自治体は `organizations`、カテゴリ、テンプレート、チェックリストを複製又は空で作成する。</p>
            <p>3. Storageパスは `organization_id/document_id/version_id` で分離する。</p>
            <p>4. RLSで別自治体データを検索結果、回答、引用、案件に含めない。</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
