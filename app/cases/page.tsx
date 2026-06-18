import Link from "next/link";
import { AlertTriangle, CalendarClock, Plus, Tag, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { caseRecords, isOverdue } from "@/lib/phase2-data";

export default function CasesPage() {
  return (
    <AppShell title="案件">
      <div className="space-y-4">
        <Link href="/cases/new" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-base font-medium text-primary-foreground shadow-sm">
          <Plus className="h-4 w-4" aria-hidden />
          相談記録を作成
        </Link>

        <div className="grid gap-3">
          {caseRecords.map((record) => {
            const overdue = isOverdue(record.dueDate) && record.status !== "完了";
            return (
              <Link key={record.id} href={`/cases/${record.id}`} className="block">
                <Card className={overdue ? "border-destructive" : undefined}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{record.caseNumber}</p>
                        <CardTitle className="line-clamp-2">{record.title}</CardTitle>
                      </div>
                      <span className={overdue ? "shrink-0 rounded-sm bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground" : "shrink-0 rounded-sm bg-muted px-2 py-1 text-xs font-medium"}>
                        {record.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">{record.category}</span>
                      <span className="rounded-sm bg-muted px-2 py-1 text-xs">{record.district}</span>
                      <span className="rounded-sm bg-muted px-2 py-1 text-xs">{record.coopName}</span>
                    </div>
                    <div className="grid gap-2 text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <UserRound className="h-4 w-4" aria-hidden />
                        担当者: {record.assignee}
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" aria-hidden />
                        次回対応: {record.nextActionDate} / 期限: {record.dueDate}
                      </p>
                      <p className="flex items-center gap-2">
                        <Tag className="h-4 w-4" aria-hidden />
                        {record.tags.join("、")}
                      </p>
                    </div>
                    {overdue ? (
                      <p className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-2 text-sm font-medium text-destructive">
                        <AlertTriangle className="h-4 w-4" aria-hidden />
                        期限を過ぎています。次回対応と関係者への連絡を確認してください。
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
