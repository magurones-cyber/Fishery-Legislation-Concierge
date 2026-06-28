import { AppShell } from "@/components/layout/app-shell";
import { Section } from "@/components/layout/section";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CategoriesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: categories, error } = await supabase.from("categories").select("code, name, description").order("code", { ascending: true });

  return (
    <AppShell title="カテゴリ">
      <Section title="情報源カテゴリ">
        <div className="space-y-3">
          {error ? <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">カテゴリを読み込めませんでした。管理者にSupabaseの初期設定を確認してください。</p> : null}
          {!error && (categories ?? []).length === 0 ? <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">カテゴリはまだ登録されていません。</p> : null}
          {(categories ?? []).map((category) => (
            <article key={category.code} className="rounded-md border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  {category.code}
                </span>
                <div>
                  <h2 className="text-sm font-semibold">{category.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{category.description ?? "説明は未設定です。"}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </AppShell>
  );
}
