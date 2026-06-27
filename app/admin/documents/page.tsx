import Link from "next/link";
import { AlertTriangle, FilePlus2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listReadableDocuments } from "@/lib/documents";
import { sourceTypeLabel } from "@/lib/rag/types";

export default async function AdminDocumentsPage() {
  const { documents, error } = await listReadableDocuments();

  return (
    <AppShell title="資料管理">
      <div className="space-y-4">
        <Link href="/admin/documents/new" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-base font-medium text-primary-foreground">
          <FilePlus2 className="h-4 w-4" aria-hidden />
          資料を登録
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>登録資料</CardTitle>
            <p className="text-sm text-muted-foreground">本文抽出・検索処理の状態を含め、Supabaseに登録されている資料を表示します。</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <p className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
            {!error && documents.length === 0 ? <p className="text-sm text-muted-foreground">登録資料はありません。</p> : null}
            {documents.map((document) => {
              const hasProcessingIssue = document.processingStatus !== "searchable" || Boolean(document.processingError);
              const overdue = Boolean(document.nextCheckedAt && new Date(document.nextCheckedAt) < new Date());
              return (
                <Link key={document.id} href={`/admin/documents/${document.id}`} className="block">
                  <article className={hasProcessingIssue || overdue ? "rounded-md border border-secondary bg-background p-3" : "rounded-md border bg-background p-3"}>
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="break-words text-sm font-semibold leading-snug">{document.title}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">{sourceTypeLabel(document.sourceType)} / {document.categoryName ?? "カテゴリ未設定"}</p>
                      </div>
                      <span className="shrink-0 rounded-sm bg-muted px-2 py-1 text-xs">{document.processingStatus}</span>
                    </div>
                    {hasProcessingIssue ? (
                      <p className="mt-2 flex items-start gap-2 rounded-md bg-secondary/10 p-2 text-xs font-medium">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        {document.processingStatus === "searchable" ? "注意: " : "本文検索未完了。"}
                        {document.processingError ?? "処理状態を確認してください。"}
                      </p>
                    ) : null}
                    {overdue ? <p className="mt-2 text-xs font-medium text-destructive">更新確認期限を過ぎています（{document.nextCheckedAt}）。</p> : null}
                  </article>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
