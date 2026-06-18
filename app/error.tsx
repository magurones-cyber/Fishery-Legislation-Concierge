"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-md border bg-card p-4 text-center shadow-sm">
        <h1 className="text-lg font-semibold">エラーが発生しました</h1>
        <p className="mt-2 text-sm text-muted-foreground">通信状態または設定を確認して、再度お試しください。</p>
        <Button className="mt-4 w-full" onClick={reset}>
          再読み込み
        </Button>
      </div>
    </div>
  );
}
