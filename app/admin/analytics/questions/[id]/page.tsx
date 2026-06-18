import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { QuestionLogAccessForm } from "@/components/admin/question-log-access-form";
import { AppShell } from "@/components/layout/app-shell";
import { anonymizedQuestionLogs } from "@/lib/question-log-analytics";

export default async function QuestionLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const preview = anonymizedQuestionLogs.find((log) => log.id === id);
  if (!preview) notFound();

  return (
    <AppShell title="個別ログ">
      <div className="space-y-4">
        <Link href="/admin/analytics/questions" className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          個別ログ一覧へ戻る
        </Link>

        <div className="rounded-md border bg-card p-4 text-sm">
          <p className="font-semibold">マスキング済みプレビュー</p>
          <p className="mt-2 leading-relaxed">{preview.maskedQuestion}</p>
          <p className="mt-2 text-muted-foreground">所属: {preview.organization} / 利用者: {preview.userLabel} / 回答信頼度: {preview.confidence}</p>
        </div>

        <QuestionLogAccessForm logId={preview.id} />
      </div>
    </AppShell>
  );
}
