import { DatabaseBackup, Settings, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { maskingSettings } from "@/lib/phase3-data";

export default function AdminSettingsPage() {
  return (
    <AppShell title="設定">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" aria-hidden />
              システム設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="space-y-1 text-sm font-medium">
              既定自治体ID
              <Input defaultValue={process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? "未設定"} />
            </label>
            <label className="space-y-1 text-sm font-medium">
              回答モデル
              <Input defaultValue={process.env.OPENAI_MODEL ?? "gpt-4.1-mini"} />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" aria-hidden />
              マスキング設定
            </CardTitle>
            <p className="text-sm text-muted-foreground">AI送信前の検知・置換対象を管理します。</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {maskingSettings.map((setting) => (
              <label key={setting.key} className="flex items-center justify-between rounded-md border bg-background p-3 text-sm">
                <span>{setting.label}</span>
                <input type="checkbox" defaultChecked={setting.enabled} className="h-5 w-5 accent-primary" />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseBackup className="h-4 w-4" aria-hidden />
              バックアップと復元
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>削除は論理削除とし、`deleted_at`、`deleted_by`、`delete_reason`を保存します。</p>
            <p>資料は`document_versions`、案件は履歴と添付を保持したまま復元します。</p>
            <p>復元操作は監査ログに記録し、管理者以上に限定します。</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
