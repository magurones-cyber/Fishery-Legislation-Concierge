import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { adminLinks } from "@/components/layout/nav-links";

export default function AdminPage() {
  return (
    <AppShell title="メニュー">
      <div className="space-y-4">
        <div className="rounded-md border bg-card p-4">
          <h1 className="text-lg font-semibold">管理メニュー</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            試行運用では、まず「資料管理」「ユーザー管理」「自治体別設定」「監査ログ」を確認してください。各項目は所属とロールに応じて表示・操作範囲が変わります。
          </p>
        </div>
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href} className="flex items-center justify-between gap-3 rounded-md border bg-card p-4 active:bg-muted">
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{link.label}</span>
              <span className="mt-1 block break-words text-xs leading-relaxed text-muted-foreground">{link.description}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
