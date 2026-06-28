import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: categories, error } = await supabase.from("categories").select("code, name").order("code", { ascending: true });

  return (
    <AppShell title="カテゴリ管理">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            カテゴリ
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden />
              追加
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {error ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">カテゴリを読み込めませんでした。Supabaseの初期SQLとRLSを確認してください。</p> : null}
          {!error && (categories ?? []).length === 0 ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">カテゴリはまだ登録されていません。初期SQL又はカテゴリ追加から登録してください。</p> : null}
          {(categories ?? []).map((category) => (
            <div key={category.code} className="rounded-md border bg-background p-3 text-sm">
              {category.code}_{category.name}
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
