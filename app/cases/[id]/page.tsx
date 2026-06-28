import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, ClipboardCheck, History, Pencil, ShieldAlert, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { CaseDeleteButton } from "@/components/phase2/case-delete-button";
import { GeneratedDocumentPanel } from "@/components/phase2/generated-document-panel";
import { PhotoAttachments } from "@/components/phase4/photo-attachments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCase } from "@/lib/cases";
import { checklistRecords, historyTypes, isOverdue } from "@/lib/phase2-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { record, isDatabaseRecord } = await getCase(id);

  if (!record) {
    notFound();
  }

  const overdue = isOverdue(record.dueDate) && record.status !== "完了";
  const timeline = [
    { at: record.consultedAt, type: "面談", actor: record.assignee, content: record.content, next: record.nextActionDate, visibility: "漁協職員以上" },
    { at: record.updatedAt, type: "AI回答", actor: "AI回答保存", content: record.aiAnswer, next: record.nextActionDate, visibility: "自治体職員以上" },
    { at: record.updatedAt, type: historyTypes.includes("庁内協議") ? "庁内協議" : "その他", actor: record.assignee, content: record.internalMemo, next: record.dueDate, visibility: "自治体職員以上" }
  ];

  return (
    <AppShell title="案件詳細">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/cases" className="inline-flex items-center gap-1 text-sm text-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            案件一覧へ戻る
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/cases/${record.id}/edit`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium">
              <Pencil className="h-4 w-4" aria-hidden />
              編集
            </Link>
            {isDatabaseRecord ? <CaseDeleteButton caseId={record.id} /> : null}
          </div>
        </div>

        <Card className={overdue ? "border-destructive" : undefined}>
          <CardHeader>
            <p className="text-xs font-medium text-muted-foreground">{record.caseNumber}</p>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg">{record.title}</CardTitle>
              <span className={overdue ? "rounded-sm bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground" : "rounded-sm bg-muted px-2 py-1 text-xs font-medium"}>{record.status}</span>
            </div>
            <p className="text-sm text-muted-foreground">{record.category} / {record.district} / {record.municipality}</p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {overdue ? (
              <p className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-3 font-medium text-destructive">
                <ShieldAlert className="h-4 w-4" aria-hidden />
                期限超過: 対応期限 {record.dueDate}
              </p>
            ) : null}
            <dl className="grid gap-2">
              {[
                ["相談日", record.consultedAt],
                ["相談者", `${record.requester}（${record.requesterType}）`],
                ["漁協名", record.coopName],
                ["漁港名", record.fishingPort],
                ["魚種・漁業種類", `${record.species} / ${record.fisheryType}`],
                ["担当者", record.assignee],
                ["次回対応日", record.nextActionDate],
                ["期限", record.dueDate],
                ["関係者", record.stakeholders],
                ["タグ", record.tags.join("、")]
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[6rem_1fr] gap-2 rounded-md bg-muted p-2">
                  <dt className="font-medium">{label}</dt>
                  <dd className="text-muted-foreground">{value}</dd>
                </div>
              ))}
            </dl>
            <section className="space-y-2">
              <h2 className="font-semibold">相談内容</h2>
              <p className="leading-relaxed text-muted-foreground">{record.content}</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-semibold">AI回答</h2>
              <p className="leading-relaxed text-muted-foreground">{record.aiAnswer}</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-semibold">根拠資料</h2>
              <div className="grid gap-2">
                {record.sources.map((source) => (
                  <div key={source} className="rounded-md border bg-background p-3">
                    <p className="font-medium">{source}</p>
                    <p className="text-xs text-muted-foreground">資料詳細へのリンクはRAG検索結果のチャンクIDと接続します。</p>
                  </div>
                ))}
              </div>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" aria-hidden />
              対応履歴
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.map((item) => (
              <div key={`${item.at}-${item.type}`} className="rounded-md border bg-background p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.type}</p>
                    <p className="text-xs text-muted-foreground">{item.at} / {item.actor} / {item.visibility}</p>
                  </div>
                  <span className="rounded-sm bg-muted px-2 py-1 text-xs">次回 {item.next}</span>
                </div>
                <p className="mt-2 leading-relaxed text-muted-foreground">{item.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" aria-hidden />
              紐付けチェックリスト
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {checklistRecords.map((checklist) => (
              <Link key={checklist.id} href={`/checklists/${checklist.id}`} className="flex items-center justify-between rounded-md border bg-background p-3 text-sm">
                <span>{checklist.title}</span>
                <span className="rounded-sm bg-muted px-2 py-1 text-xs">進捗 0/{checklist.items.length}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <GeneratedDocumentPanel record={record} />

        <Card>
          <CardHeader>
            <CardTitle>写真添付</CardTitle>
            <p className="text-sm text-muted-foreground">現地写真、施設写真、領収書、請求書、漁船、機器、排水状況、市場衛生状況を案件に紐付けます。</p>
          </CardHeader>
          <CardContent>
            <PhotoAttachments />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4" aria-hidden />
              お気に入り対象
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>重要な案件、AI回答、根拠資料、チェックリスト、生成文書はお気に入りに登録して再確認できます。</p>
            <p className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" aria-hidden />
              添付資料はStorageの公開範囲と案件権限に従って表示します。
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
