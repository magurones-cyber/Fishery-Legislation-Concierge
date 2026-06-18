import { AppShell } from "@/components/layout/app-shell";
import { CaseForm } from "@/components/phase2/case-form";

export default function NewCasePage() {
  return (
    <AppShell title="案件作成">
      <CaseForm mode="new" />
    </AppShell>
  );
}
