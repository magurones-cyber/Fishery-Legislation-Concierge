import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { anonymizedQuestionLogSummary } from "@/lib/question-log-analytics";

export default function AnalyticsCategoriesPage() {
  return (
    <AppShell title="カテゴリ別分析">
      <Card>
        <CardHeader>
          <CardTitle>カテゴリ別質問数</CardTitle>
          <p className="text-sm text-muted-foreground">匿名化済みの集計のみを表示します。</p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {anonymizedQuestionLogSummary.byCategory.map((item) => (
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
