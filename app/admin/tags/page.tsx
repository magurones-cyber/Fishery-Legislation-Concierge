import { Tag } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTagsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: tags, error } = await supabase.from("tags").select("id, name").order("name", { ascending: true });

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
          {error ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">タグを読み込めませんでした。Supabaseの初期SQLとRLSを確認してください。</p> : null}
          {!error && (tags ?? []).length === 0 ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">タグはまだ登録されていません。資料登録時のタグ又は初期SQLから追加してください。</p> : null}
          {(tags ?? []).map((tag) => (
            <span key={tag.id} className="rounded-sm border bg-background px-3 py-2 text-sm">{tag.name}</span>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
