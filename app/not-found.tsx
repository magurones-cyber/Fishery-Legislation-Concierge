import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-md border bg-card p-4 text-center shadow-sm">
        <h1 className="text-lg font-semibold">ページが見つかりません</h1>
        <p className="mt-2 text-sm text-muted-foreground">指定された画面または資料は存在しません。</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
