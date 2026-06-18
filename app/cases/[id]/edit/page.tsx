import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { CaseForm } from "@/components/phase2/case-form";
import { caseRecords } from "@/lib/phase2-data";

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = caseRecords.find((item) => item.id === id);

  if (!record) {
    notFound();
  }

  return (
    <AppShell title="案件編集">
      <div className="space-y-4">
        <Link href={`/cases/${record.id}`} className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          案件詳細へ戻る
        </Link>
        <CaseForm mode="edit" record={record} />
      </div>
    </AppShell>
  );
}
