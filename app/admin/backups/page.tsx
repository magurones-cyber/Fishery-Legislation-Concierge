import { DatabaseBackup } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const backupSteps = [
  "SupabaseのDBバックアップとStorageエクスポートを取得する",
  "backups bucket又は管理者指定の外部保存先へ暗号化して保存する",
  "復元テストを四半期ごとに実施し、監査ログへ記録する",
  "実データのダンプ、PDF、証憑、写真をGitHubへ置かない"
];

export default function AdminBackupsPage() {
  return (
    <AppShell title="バックアップ">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseBackup className="h-4 w-4" aria-hidden />
            バックアップ運用
          </CardTitle>
          <p className="text-sm text-muted-foreground">この画面は本番接続前の運用設計です。実行処理は管理者権限と監査ログ接続後に有効化します。</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {backupSteps.map((step, index) => (
            <div key={step} className="rounded-md border bg-background p-3 text-sm">
              <span className="mr-2 rounded-md bg-muted px-2 py-1 text-xs">{index + 1}</span>
              {step}
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
