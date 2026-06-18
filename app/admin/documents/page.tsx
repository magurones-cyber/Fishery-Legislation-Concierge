import Link from "next/link";
import { AlertTriangle, FilePlus2, History } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isUpdateOverdue, managedDocuments } from "@/lib/phase3-data";

export default function AdminDocumentsPage() {
  return (
    <AppShell title="資料管理">
      <div className="space-y-4">
        <Link href="/admin/documents/new" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-base font-medium text-primary-foreground">
          <FilePlus2 className="h-4 w-4" aria-hidden />
          資料を登録
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>更新確認が必要な資料</CardTitle>
            <p className="text-sm text-muted-foreground">次回確認日を過ぎた資料は、回答根拠に使う際も警告対象です。</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {managedDocuments.map((document) => {
              const overdue = isUpdateOverdue(document);
              return (
                <Link key={document.id} href={`/admin/documents/${document.id}`} className="block">
                  <article className={overdue ? "rounded-md border border-destructive bg-background p-3" : "rounded-md border bg-background p-3"}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold leading-snug">{document.title}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {document.version} / {document.sourceType} / 状態: {document.state}
                        </p>
                      </div>
                      <span className={overdue ? "rounded-sm bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground" : "rounded-sm bg-muted px-2 py-1 text-xs"}>
                        次回 {document.nextCheckedAt}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">影響範囲: {document.impactScope}</p>
                    {overdue ? (
                      <p className="mt-2 flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-xs font-medium text-destructive">
                        <AlertTriangle className="h-4 w-4" aria-hidden />
                        更新期限を過ぎています。
                      </p>
                    ) : null}
                  </article>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Link href="/admin/documents/doc-port-use/versions" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium">
          <History className="h-4 w-4" aria-hidden />
          バージョン差分を確認
        </Link>
      </div>
    </AppShell>
  );
}
