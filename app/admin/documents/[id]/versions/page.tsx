import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GitCompareArrows } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { diffLines, managedDocuments } from "@/lib/phase3-data";

export default async function AdminDocumentVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = managedDocuments.find((item) => item.id === id);

  if (!document) notFound();

  const diffs = diffLines(document.oldText, document.newText);

  return (
    <AppShell title="資料バージョン">
      <div className="space-y-4">
        <Link href={`/admin/documents/${document.id}`} className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          資料詳細へ戻る
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-4 w-4" aria-hidden />
              {document.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">旧版を上書きせず、バージョンと差分を保存します。</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-md border bg-background p-3">
              <p className="mb-2 text-sm font-semibold">旧版</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{document.oldText}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="mb-2 text-sm font-semibold">新版</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{document.newText}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>差分</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {diffs.map((diff, index) => (
              <div
                key={`${diff.type}-${index}`}
                className={
                  diff.type === "追加"
                    ? "rounded-md border border-primary bg-primary/10 p-3 text-sm"
                    : diff.type === "削除"
                      ? "rounded-md border border-destructive bg-destructive/10 p-3 text-sm"
                      : "rounded-md border bg-background p-3 text-sm"
                }
              >
                <span className="mb-1 inline-block rounded-sm bg-muted px-2 py-1 text-xs">{diff.type}</span>
                <p className="leading-relaxed">{diff.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
