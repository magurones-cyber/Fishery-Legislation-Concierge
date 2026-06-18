import { AppShell } from "@/components/layout/app-shell";
import { Section } from "@/components/layout/section";
import { categories } from "@/lib/mock-data";

export default function CategoriesPage() {
  return (
    <AppShell title="カテゴリ">
      <Section title="情報源カテゴリ">
        <div className="space-y-3">
          {categories.map((category) => (
            <article key={category.code} className="rounded-md border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  {category.code}
                </span>
                <div>
                  <h2 className="text-sm font-semibold">{category.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </AppShell>
  );
}
