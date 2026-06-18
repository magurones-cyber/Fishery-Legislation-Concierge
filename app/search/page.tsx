import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SearchPanel } from "@/components/rag/search-panel";

export default function SearchPage() {
  return (
    <AppShell title="検索">
      <Suspense fallback={<p className="text-sm text-muted-foreground">検索画面を読み込み中です。</p>}>
        <SearchPanel />
      </Suspense>
    </AppShell>
  );
}
