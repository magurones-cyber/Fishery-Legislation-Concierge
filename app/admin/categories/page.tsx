import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categories } from "@/lib/mock-data";

export default function AdminCategoriesPage() {
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
          {categories.map((category) => (
            <div key={category.code} className="rounded-md border bg-background p-3 text-sm">
              {category.code}_{category.name}
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
