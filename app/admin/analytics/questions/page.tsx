import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { anonymizedQuestionLogs } from "@/lib/question-log-analytics";

export default function AnalyticsQuestionsPage() {
  return (
    <AppShell title="個別ログ閲覧">
      <div className="space-y-4">
        <div className="rounded-md border border-secondary/70 bg-secondary/15 p-3 text-sm leading-relaxed">
          この一覧はマスキング済みです。個別ログを開く前に閲覧理由を必ず入力し、閲覧事実をaudit_logsへ保存します。
        </div>
        <Card>
          <CardHeader>
            <CardTitle>マスキング済み質問ログ</CardTitle>
            <p className="text-sm text-muted-foreground">氏名、メール、電話番号、船名、個別事業者名は表示しません。</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {anonymizedQuestionLogs.map((log) => (
              <Link key={log.id} href={`/admin/analytics/questions/${log.id}`} className="block rounded-md border bg-background p-3 active:bg-muted">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium leading-relaxed">{log.maskedQuestion}</p>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs">{log.confidence}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{log.category}</p>
                <p className="text-xs text-muted-foreground">所属: {log.organization} / 利用者: {log.userLabel} / 評価: {log.feedback}</p>
                <p className="text-xs text-muted-foreground">不足資料: {log.missingSources.join("、") || "なし"}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
