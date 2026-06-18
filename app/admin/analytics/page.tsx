import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { anonymizedQuestionLogSummary, roleAccessMatrix } from "@/lib/question-log-analytics";
import { usageMetrics } from "@/lib/phase4-data";

const links = [
  { href: "/admin/analytics/questions", label: "個別ログ閲覧" },
  { href: "/admin/analytics/categories", label: "カテゴリ別分析" },
  { href: "/admin/analytics/missing-sources", label: "不足資料" },
  { href: "/admin/analytics/feedback", label: "回答評価" },
  { href: "/admin/analytics/faq-candidates", label: "FAQ候補" }
];

export default function AdminAnalyticsPage() {
  return (
    <AppShell title="質問ログ分析">
      <div className="space-y-4">
        <div className="rounded-md border border-secondary/70 bg-secondary/15 p-3 text-sm leading-relaxed">
          質問ログには個人情報又は機密情報が含まれる可能性があります。この画面は匿名化又はマスキング済みの集計のみを表示します。閲覧・分析は、利用規約に定める目的の範囲内で行い、外部提供又は目的外利用を行わないでください。
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md border bg-card p-4 text-sm font-semibold active:bg-muted">
              {link.label}
            </Link>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>利用状況サマリー</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            {usageMetrics.map((metric) => (
              <Metric key={metric.label} label={metric.label} value={metric.value} trend={metric.trend} />
            ))}
          </CardContent>
        </Card>
        <SummarySection title="カテゴリ別" items={anonymizedQuestionLogSummary.byCategory} />
        <SummarySection title="所属別" items={anonymizedQuestionLogSummary.byOrganization} />
        <SummarySection title="期間別" items={anonymizedQuestionLogSummary.byPeriod} />
        <SummarySection title="回答信頼度別" items={anonymizedQuestionLogSummary.byConfidence} />
        <SummarySection title="不足資料別" items={anonymizedQuestionLogSummary.byMissingSource} />
        <SummarySection title="回答評価別" items={anonymizedQuestionLogSummary.byFeedback} />

        <Card>
          <CardHeader>
            <CardTitle>ロール別閲覧制御</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {roleAccessMatrix.map((row) => (
              <div key={row.role} className="rounded-md border bg-background p-3">
                <p className="font-semibold">{row.role}</p>
                <p className="mt-1 text-muted-foreground">集計: {row.aggregate}</p>
                <p className="text-muted-foreground">個別: {row.individual}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
      {trend ? <p className="text-xs text-muted-foreground">{trend}</p> : null}
    </div>
  );
}

function SummarySection({ title, items }: { title: string; items: Array<{ label: string; count: number; trend: string }> }) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0 break-words">{item.label}</span>
              <span className="shrink-0 font-semibold">{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(8, Math.round((item.count / maxCount) * 100))}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{item.trend}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
