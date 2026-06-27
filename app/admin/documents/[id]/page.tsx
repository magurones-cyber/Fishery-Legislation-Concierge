import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentEditForm } from "@/components/rag/document-edit-form";
import { getReadableDocument } from "@/lib/documents";
import { sourceTypeLabel, visibilityLabel } from "@/lib/rag/types";

export default async function AdminDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { document, chunks, fileUrl } = await getReadableDocument(id);

  if (!document) notFound();

  return (
    <AppShell title="資料編集">
      <div className="space-y-4">
        <Link href="/admin/documents" className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          資料管理へ戻る
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{document.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {sourceTypeLabel(document.sourceType)} / {visibilityLabel(document.visibility)} / {document.categoryName ?? "カテゴリ未設定"}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">処理状態</p>
                <p className="font-medium">{document.processingStatus}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">チャンク</p>
                <p className="font-medium">{chunks.length}件</p>
              </div>
            </div>
            {document.processingError ? <p className="rounded-md border border-secondary bg-secondary/10 p-3 text-sm">{document.processingError}</p> : null}
            {fileUrl ? (
              <Link href={fileUrl} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium" target="_blank">
                <ExternalLink className="h-4 w-4" aria-hidden />
                原本ファイルを開く
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>資料情報を編集</CardTitle>
            <p className="text-sm text-muted-foreground">誤登録した資料は「誤登録を削除」で一覧・検索対象から外せます。</p>
          </CardHeader>
          <CardContent>
            <DocumentEditForm document={document} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
