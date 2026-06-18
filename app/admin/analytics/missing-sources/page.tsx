import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { anonymizedQuestionLogSummary } from "@/lib/question-log-analytics";

export default function MissingSourcesPage() {
  return (
    <AppShell title="不足資料">
      <Card>
        <CardHeader>
          <CardTitle>不足資料候補</CardTitle>
          <p className="text-sm text-muted-foreground">不足資料の件数のみを表示し、質問本文や個人情報は表示しません。</p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {anonymizedQuestionLogSummary.byMissingSource.map((item) => (
            <div key={item.label} className="rounded-md border bg-background p-3">
              <div className="flex justify-between gap-3">
                <span>{item.label}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.trend}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
