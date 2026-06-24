import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { sourceTypeLabel, visibilityLabel, type SearchResult } from "@/lib/rag/types";

export function SourceCard({ source }: { source: SearchResult }) {
  return (
    <article className="rounded-md border bg-card p-4 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">{source.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {sourceTypeLabel(source.source_type)} / {source.category_name ?? "カテゴリ未設定"}
          </p>
        </div>
        <span className="shrink-0 rounded-sm bg-muted px-2 py-1 text-xs">{source.result_kind === "metadata" ? "資料名一致" : `${Math.round(source.score * 100)}%`}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">法令番号</dt>
          <dd>{source.document_number ?? "未設定"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">条文番号</dt>
          <dd>{source.article_number ?? "該当なし"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">ページ</dt>
          <dd>{source.page_start ? `p.${source.page_start}` : "不明"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">最終改正日</dt>
          <dd>{source.last_amended_at ?? "未設定"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">公開範囲</dt>
          <dd>{visibilityLabel(source.visibility)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">所管</dt>
          <dd>{source.issuing_authority ?? "未設定"}</dd>
        </div>
      </dl>
      {source.heading ? <p className="mt-3 font-medium">{source.heading}</p> : null}
      {source.result_kind === "metadata" ? (
        <p className="mt-3 flex items-start gap-2 rounded-md border border-secondary bg-secondary/10 p-2 text-xs font-medium">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>資料情報が一致しました。{source.processing_status !== "searchable" ? `本文検索は未完了です（${source.processing_status}）。` : "引用は資料詳細で確認してください。"}</span>
        </p>
      ) : !source.citation_text ? (
        <p className="mt-3 flex items-center gap-2 rounded-md border border-secondary bg-secondary/10 p-2 text-xs font-medium">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          引用文が未設定です。資料詳細で原文を確認してください。
        </p>
      ) : null}
      {source.result_kind !== "metadata" ? (
        <blockquote className="mt-3 break-words border-l-4 border-primary bg-muted p-3 text-sm leading-relaxed">
          {source.citation_text ?? source.content.slice(0, 260)}
        </blockquote>
      ) : null}
      <Link
        href={`/documents/${source.document_id}?chunk=${source.chunk_id}#chunk-${source.chunk_id}`}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium active:bg-muted"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        資料を開く
      </Link>
    </article>
  );
}
