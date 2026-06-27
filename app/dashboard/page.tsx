import Link from "next/link";
import { ArrowRight, Clock, Star } from "lucide-react";
import { QuestionEntry } from "@/components/dashboard/question-entry";
import { AppShell } from "@/components/layout/app-shell";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { menuItems } from "@/lib/mock-data";
import { updateNotifications } from "@/lib/phase3-data";
import { listRecentQuestions } from "@/lib/question-history";

export default async function DashboardPage() {
  const { questions: recentQuestions, error: recentQuestionsError } = await listRecentQuestions();

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className="break-words text-xl font-bold leading-tight sm:text-2xl">漁業関係法令コンシェルジュ</h1>
          <QuestionEntry />
        </section>

        <Section title="よく使うメニュー">
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
            {menuItems.map((item) => (
              <Link
                key={item}
                href={item === "遊漁船" ? "/search?category=12" : "/search"}
                className="flex min-h-14 min-w-0 items-center justify-center break-words rounded-md border bg-card px-2 text-center text-sm font-medium leading-snug active:bg-muted"
              >
                {item}
              </Link>
            ))}
          </div>
        </Section>

        <Section title="最近の質問">
          <div className="space-y-2">
            {recentQuestionsError ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">{recentQuestionsError}</p> : null}
            {!recentQuestionsError && recentQuestions.length === 0 ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">まだ質問履歴はありません。ホームの入力欄から質問すると、ここに表示されます。</p> : null}
            {recentQuestions.map((question) => (
              <Link key={question.id} href={`/ask?q=${encodeURIComponent(question.title)}&auto=1`} className="flex min-w-0 items-center justify-between gap-2 rounded-md border bg-card p-3">
                <span className="min-w-0 break-words text-sm leading-snug">{question.title}</span>
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
