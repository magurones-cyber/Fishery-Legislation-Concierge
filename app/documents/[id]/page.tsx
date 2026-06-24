import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReadableDocument } from "@/lib/documents";
import { sourceTypeLabel, visibilityLabel } from "@/lib/rag/types";

export default async function DocumentDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chunk?: string }>;
}) {
  const { id } = await params;
  const { chunk: selectedChunkId } = await searchParams;
  const { document, chunks, fileUrl } = await getReadableDocument(id);
  if (!document) notFound();

  return (
    <AppShell title="資料詳細">
      <div className="min-w-0 space-y-4">
        <Link href="/documents" className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          資料一覧へ戻る
        </Link>
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <div className="flex min-w-0 flex-col gap-2 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
              <CardTitle className="min-w-0 break-words text-lg">{document.title}</CardTitle>
              <span className="w-fit shrink-0 rounded-sm bg-muted px-2 py-1 text-xs">{sourceTypeLabel(document.sourceType)}</span>
            </div>
            <p className="text-sm text-muted-foreground">更新日: {new Date(document.updatedAt).toLocaleDateString("ja-JP")}</p>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4">
            {document.processingStatus !== "searchable" ? (
              <div className="flex gap-2 rounded-md border border-secondary bg-secondary/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-medium">本文検索はまだ利用できません。</p>
                  <p className="mt-1 break-words text-muted-foreground">処理状態: {document.processingStatus}{document.processingError ? ` / ${document.processingError}` : ""}</p>
                </div>
              </div>
            ) : null}
            <dl className="grid grid-cols-1 gap-3 text-sm min-[380px]:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">カテゴリ</dt><dd>{document.categoryName ?? "未設定"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">公開範囲</dt><dd>{visibilityLabel(document.visibility)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">法令番号</dt><dd>{document.documentNumber ?? "未設定"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">所管</dt><dd>{document.issuingAuthority ?? "未設定"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">施行日</dt><dd>{document.effectiveDate ?? "未設定"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">最終改正日</dt><dd>{document.lastAmendedAt ?? "未設定"}</dd></div>
            </dl>
            {document.notes ? <p className="break-words text-sm leading-relaxed">{document.notes}</p> : null}
            <div className="rounded-md bg-muted p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" aria-hidden />法的効力</div>
              <p className="text-sm text-muted-foreground">{document.legalEffect}</p>
            </div>
            {fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium">
                <ExternalLink className="h-4 w-4" aria-hidden />原本を開く（5分間有効）
              </a>
            ) : null}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">抽出された本文</h2>
          {chunks.length === 0 ? <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">表示できる本文チャンクはありません。原本または処理状態を確認してください。</p> : null}
          {chunks.map((chunk) => (
            <article id={`chunk-${chunk.id}`} key={chunk.id} className={selectedChunkId === chunk.id ? "scroll-mt-20 rounded-md border-2 border-primary bg-card p-4" : "scroll-mt-20 rounded-md border bg-card p-4"}>
              <p className="text-xs text-muted-foreground">{chunk.articleNumber ?? "条文番号なし"} / {chunk.pageStart ? `p.${chunk.pageStart}` : "ページ不明"}</p>
              {chunk.heading ? <h3 className="mt-1 font-semibold">{chunk.heading}</h3> : null}
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{chunk.citationText ?? chunk.content}</p>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
