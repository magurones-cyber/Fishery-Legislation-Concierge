import { Tag } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tags = ["漁港利用", "遊漁船", "補助金", "消費税", "漁協指導", "員外利用", "養殖", "排水", "安全管理", "更新期限切れ"];

export default function AdminTagsPage() {
  return (
    <AppShell title="タグ管理">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" aria-hidden />
            タグ
          </CardTitle>
          <p className="text-sm text-muted-foreground">検索、案件、更新影響範囲、FAQ候補の分類に使います。</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-sm border bg-background px-3 py-2 text-sm">{tag}</span>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
