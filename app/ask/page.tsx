import { AppShell } from "@/components/layout/app-shell";
import { AskPanel } from "@/components/rag/ask-panel";

export default async function AskPage({ searchParams }: { searchParams: Promise<{ auto?: string; q?: string }> }) {
  const { auto, q } = await searchParams;
  return (
    <AppShell title="質問">
      <AskPanel autoSubmit={auto === "1"} initialQuestion={q?.slice(0, 4000) ?? ""} />
    </AppShell>
  );
}
