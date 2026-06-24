import Link from "next/link";
import { AlertTriangle, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Section } from "@/components/layout/section";
import { listReadableDocuments } from "@/lib/documents";
import { sourceTypeLabel } from "@/lib/rag/types";

export default async function DocumentsPage() {
  const { documents, error } = await listReadableDocuments();
  return (
    <AppShell title="資料一覧">
      <Section title="登録資料">
        {error ? <p className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        {!error && documents.length === 0 ? <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">閲覧できる登録資料はまだありません。</p> : null}
        <div className="space-y-3">
          {documents.map((document) => (
            <Link key={document.id} href={`/documents/${document.id}`} className="flex gap-3 rounded-md border bg-card p-4 active:bg-muted">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-snug">{document.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{document.categoryName ?? "カテゴリ未設定"}{document.issuingAuthority ? ` / ${document.issuingAuthority}` : ""}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {sourceTypeLabel(document.sourceType)} / {document.pageCount ?? "-"}ページ / 更新日 {new Date(document.updatedAt).toLocaleDateString("ja-JP")}
                </p>
                {document.processingStatus !== "searchable" ? (
                  <p className="mt-2 flex items-start gap-1 rounded-md border border-secondary bg-secondary/10 p-2 text-xs">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    本文検索未完了（{document.processingStatus}）。資料情報と原本は確認できます。
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </AppShell>
  );
}
