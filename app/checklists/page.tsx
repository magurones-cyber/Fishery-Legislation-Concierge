import Link from "next/link";
import { CheckSquare, Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checklistRecords } from "@/lib/phase2-data";

export default function ChecklistsPage() {
  return (
    <AppShell title="チェックリスト">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" aria-hidden />
              業務チェックリスト
            </CardTitle>
            <p className="text-sm text-muted-foreground">案件に紐付けて進捗を保存し、聞き漏れ、証憑漏れ、行政リスクを確認します。</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <Pencil className="h-4 w-4" aria-hidden />
              管理者はSupabase接続後にチェックリスト項目を編集できます。
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          {checklistRecords.map((checklist) => (
            <Link key={checklist.id} href={`/checklists/${checklist.id}`} className="block">
              <Card>
                <CardHeader>
                  <CardTitle>{checklist.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{checklist.description}</p>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm">
                  <span>{checklist.items.length}項目</span>
                  <span className="rounded-sm bg-muted px-2 py-1 text-xs">進捗保存対応</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
