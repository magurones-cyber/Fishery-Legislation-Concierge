import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { documents } from "@/lib/mock-data";

export default async function DocumentDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chunk?: string }>;
}) {
  const { id } = await params;
  const { chunk } = await searchParams;
  const document = documents.find((item) => item.id === id);

  if (!document) {
    notFound();
  }

  return (
    <AppShell title="資料詳細">
      <div className="space-y-4">
        <Link href="/documents" className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          資料一覧へ戻る
        </Link>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg">{document.title}</CardTitle>
              <span className="shrink-0 rounded-sm bg-muted px-2 py-1 text-xs">{document.sourceType}</span>
            </div>
            <p className="text-sm text-muted-foreground">更新日: {document.updatedAt}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{document.summary}</p>
            {chunk ? (
              <div className="rounded-md border border-primary bg-primary/10 p-3 text-sm">
                引用箇所ID: {chunk}
                <p className="mt-1 text-muted-foreground">実資料接続後、このIDに対応するチャンク位置へ移動します。</p>
              </div>
            ) : null}
            <div className="rounded-md bg-muted p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                法的効力
              </div>
              <p className="text-sm text-muted-foreground">{document.legalEffect}</p>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold">引用候補</h2>
              <ul className="space-y-2">
                {document.citations.map((citation) => (
                  <li key={citation} className="rounded-md border bg-background p-3 text-sm">
                    {citation}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
