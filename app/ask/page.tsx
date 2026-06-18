import { AppShell } from "@/components/layout/app-shell";
import { AskPanel } from "@/components/rag/ask-panel";

export default function AskPage() {
  return (
    <AppShell title="質問">
      <AskPanel />
    </AppShell>
  );
}
