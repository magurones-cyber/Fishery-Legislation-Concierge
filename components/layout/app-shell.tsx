import Link from "next/link";
import { Bell, FileText, UserRound } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LogoutButton } from "@/components/auth/logout-button";
import { ADMIN_ROLES, getAuthContext, hasAnyRole } from "@/lib/auth";

export async function AppShell({
  title = "漁業関係法令コンシェルジュ",
  children
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const auth = await getAuthContext().catch(() => null);
  const isAdmin = Boolean(auth && hasAnyRole(auth, ADMIN_ROLES));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/dashboard" className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{title}</p>
            <p className="text-xs text-muted-foreground">根拠付き検索・相談支援</p>
          </Link>
          <div className="flex items-center gap-1">
            <Link className="inline-flex h-10 w-10 items-center justify-center rounded-md active:bg-muted" href="/documents">
              <FileText className="h-5 w-5" aria-hidden />
              <span className="sr-only">資料</span>
            </Link>
            {isAdmin ? (
              <>
                <Link className="inline-flex h-10 w-10 items-center justify-center rounded-md active:bg-muted" href="/admin/settings">
                  <Bell className="h-5 w-5" aria-hidden />
                  <span className="sr-only">通知</span>
                </Link>
                <Link className="inline-flex h-10 w-10 items-center justify-center rounded-md active:bg-muted" href="/admin/users">
                  <UserRound className="h-5 w-5" aria-hidden />
                  <span className="sr-only">ユーザー</span>
                </Link>
              </>
            ) : null}
            {auth ? <LogoutButton /> : null}
          </div>
        </div>
      </header>
      <main className="safe-bottom mx-auto max-w-3xl px-4 py-4">{children}</main>
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
