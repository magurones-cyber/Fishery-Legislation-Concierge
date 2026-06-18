import { AppShell } from "@/components/layout/app-shell";
import { ConsentForm } from "@/components/privacy/consent-form";

export default function ConsentPage() {
  return (
    <AppShell title="同意確認">
      <ConsentForm />
    </AppShell>
  );
}
