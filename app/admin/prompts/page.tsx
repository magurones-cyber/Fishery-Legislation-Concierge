import { MessageSquareText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { promptTemplates } from "@/lib/phase3-data";

export default function AdminPromptsPage() {
  return (
    <AppShell title="プロンプト管理">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4" aria-hidden />
            回答テンプレート
          </CardTitle>
          <p className="text-sm text-muted-foreground">資料更新の影響を受ける回答テンプレートを管理します。</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {promptTemplates.map((prompt) => (
            <article key={prompt.id} className="rounded-md border bg-background p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{prompt.name}</p>
                <span className="rounded-sm bg-muted px-2 py-1 text-xs">{prompt.status}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">v{prompt.version} / {prompt.owner} / {prompt.updatedAt}</p>
            </article>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
