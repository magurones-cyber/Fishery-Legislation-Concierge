import { ListFilter, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminOperations } from "@/lib/phase3-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLogsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: auditLogs, error } = await supabase
    .from("audit_logs")
    .select("id, created_at, action, target_table, target_id, ip_address, result")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell title="監査ログ">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListFilter className="h-4 w-4" aria-hidden />
              ログ検索
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Input type="date" aria-label="開始日" />
            <Input type="date" aria-label="終了日" />
            <Input placeholder="ユーザー、資料、案件、IPアドレス" />
            <select className="h-11 w-full rounded-md border bg-background px-3 text-sm">
              <option>操作種別を選択</option>
              {adminOperations.map((operation) => (
                <option key={operation}>{operation}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              操作ログ
            </CardTitle>
            <p className="text-sm text-muted-foreground">機密情報は平文保存せず、AI送信内容はマスキング後の要約と参照IDで記録します。</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">監査ログを読み込めませんでした。管理者ロールとRLSを確認してください。</p> : null}
            {!error && (auditLogs ?? []).length === 0 ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">監査ログはまだありません。資料登録、質問、案件更新などの操作後に記録されます。</p> : null}
            {(auditLogs ?? []).map((log) => (
              <article key={log.id} className="rounded-md border bg-background p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{String(log.created_at).replace("T", " ").slice(0, 16)}</p>
                  </div>
                  <span className="rounded-sm bg-muted px-2 py-1 text-xs">{log.result}</span>
                </div>
                <p className="mt-2 text-muted-foreground">対象: {log.target_table ?? "未設定"} {log.target_id ?? ""}</p>
                <p className="text-xs text-muted-foreground">IP: {log.ip_address ?? "未記録"}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
