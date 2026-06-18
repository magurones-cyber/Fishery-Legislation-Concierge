import Link from "next/link";
import { ArrowRight, Clock, Search, Send, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { menuItems, recentQuestions } from "@/lib/mock-data";
import { updateNotifications } from "@/lib/phase3-data";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className="text-2xl font-bold leading-tight">漁業関係法令コンシェルジュ</h1>
          <div className="rounded-md border bg-card p-3 shadow-sm">
            <Textarea placeholder="例：漁港用地で試験的な陸上養殖を実施できますか？" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/ask"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm active:scale-[0.99]"
              >
                <Send className="h-4 w-4" aria-hidden />
                質問する
              </Link>
              <Link
                href="/search"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium active:bg-muted"
              >
                <Search className="h-4 w-4" aria-hidden />
                資料を検索
              </Link>
            </div>
          </div>
        </section>

        <Section title="よく使うメニュー">
          <div className="grid grid-cols-3 gap-2">
            {menuItems.map((item) => (
              <Link
                key={item}
                href={item === "遊漁船" ? "/search?category=12" : "/search"}
                className="flex min-h-14 items-center justify-center rounded-md border bg-card px-2 text-center text-sm font-medium active:bg-muted"
              >
                {item}
              </Link>
            ))}
          </div>
        </Section>

        <Section title="最近の質問">
          <div className="space-y-2">
            {recentQuestions.map((question) => (
              <Link key={question} href="/ask" className="flex items-center justify-between rounded-md border bg-card p-3">
                <span className="text-sm leading-snug">{question}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            ))}
          </div>
        </Section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-4 w-4 text-secondary" aria-hidden />
                お気に入り
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">まだお気に入りはありません。</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" aria-hidden />
                更新された資料
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {updateNotifications.map((notification) => (
                <Link key={notification.id} href="/admin/notifications" className="block rounded-md border bg-background p-3 text-sm">
                  <span className="font-medium">{notification.documentTitle}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">施行日 {notification.effectiveDate} / {notification.impact}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
