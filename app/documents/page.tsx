import Link from "next/link";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Section } from "@/components/layout/section";
import { documents } from "@/lib/mock-data";

export default function DocumentsPage() {
  return (
    <AppShell title="資料一覧">
      <Section title="登録資料">
        <div className="space-y-3">
          {documents.map((document) => (
            <Link key={document.id} href={`/documents/${document.id}`} className="flex gap-3 rounded-md border bg-card p-4 active:bg-muted">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-snug">{document.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{document.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {document.sourceType} / {document.pageCount}ページ / 更新日 {document.updatedAt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </AppShell>
  );
}
