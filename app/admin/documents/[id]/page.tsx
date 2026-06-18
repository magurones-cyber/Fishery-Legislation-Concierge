import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bell, RotateCcw, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isUpdateOverdue, managedDocuments } from "@/lib/phase3-data";

export default async function AdminDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = managedDocuments.find((item) => item.id === id);

  if (!document) notFound();

  const overdue = isUpdateOverdue(document);

  return (
    <AppShell title="資料詳細">
      <div className="space-y-4">
        <Link href="/admin/documents" className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          資料管理へ戻る
        </Link>

        <Card className={overdue ? "border-destructive" : undefined}>
          <CardHeader>
            <CardTitle>{document.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{document.version} / {document.sourceType} / {document.state}</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["施行日", document.effectiveDate],
              ["最終改正日", document.lastAmendedAt],
              ["取得日", document.acquiredAt],
              ["取得元URL", document.sourceUrl],
              ["更新担当者", document.updateOwner],
              ["更新理由", document.updateReason],
              ["最終確認日", document.lastCheckedAt],
              ["次回確認日", document.nextCheckedAt],
              ["更新周期", document.updateCycle],
              ["改正有無", document.hasAmendment ? "あり" : "なし"],
              ["影響するFAQ", document.impactedFaq.join("、") || "なし"],
              ["影響する回答テンプレート", document.impactedPrompts.join("、") || "なし"],
              ["影響する案件", document.impactedCases.join("、") || "なし"],
              ["影響範囲", document.impactScope],
              ["公開範囲", document.visibility]
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[7rem_1fr] gap-2 rounded-md bg-muted p-2">
                <dt className="font-medium">{label}</dt>
                <dd className="min-w-0 break-words text-muted-foreground">{value}</dd>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-2">
          <Link href={`/admin/documents/${document.id}/versions`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium">
            <Bell className="h-4 w-4" aria-hidden />
            旧版・新版・差分を確認
          </Link>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium" type="button">
            <Trash2 className="h-4 w-4" aria-hidden />
            論理削除
          </button>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium" type="button">
            <RotateCcw className="h-4 w-4" aria-hidden />
            削除済み資料を復元
          </button>
        </div>
      </div>
    </AppShell>
  );
}
