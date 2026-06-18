import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checklistRecords } from "@/lib/phase2-data";

export default async function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const checklist = checklistRecords.find((item) => item.id === id);

  if (!checklist) {
    notFound();
  }

  const completed = checklist.items.slice(0, 3);

  return (
    <AppShell title="チェックリスト詳細">
      <div className="space-y-4">
        <Link href="/checklists" className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          チェックリストへ戻る
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{checklist.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{checklist.description}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">案件進捗</span>
                <span>{completed.length}/{checklist.items.length}</span>
              </div>
              <div className="h-2 rounded-full bg-background">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${(completed.length / checklist.items.length) * 100}%` }} />
              </div>
            </div>
            {checklist.items.map((item) => {
              const checked = completed.includes(item);
              return (
                <label key={item} className="flex items-start gap-3 rounded-md border bg-background p-3 text-sm">
                  <input type="checkbox" defaultChecked={checked} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
                  <span className={checked ? "font-medium" : undefined}>{item}</span>
                </label>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              保存と編集
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>案件へ紐付けたチェック結果は、`case_checklists` と `case_checklist_items` に保存する設計です。</p>
            <button type="button" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-foreground">
              <Save className="h-4 w-4" aria-hidden />
              進捗を保存
            </button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
