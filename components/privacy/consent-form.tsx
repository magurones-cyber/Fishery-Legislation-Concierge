"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENT_PRIVACY_POLICY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/privacy/consent";

export function ConsentForm() {
  const router = useRouter();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [analysis, setAnalysis] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const canSave = terms && privacy && analysis;

  async function saveConsent() {
    setMessage("同意履歴を保存しています。");
    const response = await fetch("/api/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ terms, privacy, analysis })
    });
    if (response.ok) {
      setSaved(true);
      setMessage("同意履歴を保存しました。ホームへ移動します。");
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "同意履歴を保存できませんでした。");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>利用前の同意</CardTitle>
        <p className="text-sm text-muted-foreground">初回ログイン時又は規約改定時に同意を取得し、`user_consents` に履歴を保存します。</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <label className="flex gap-2 rounded-md border bg-background p-3">
          <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="h-5 w-5 accent-primary" />
          <span>利用規約（{CURRENT_TERMS_VERSION}）に同意します</span>
        </label>
        <label className="flex gap-2 rounded-md border bg-background p-3">
          <input type="checkbox" checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} className="h-5 w-5 accent-primary" />
          <span>プライバシーポリシー（{CURRENT_PRIVACY_POLICY_VERSION}）に同意します</span>
        </label>
        <label className="flex gap-2 rounded-md border bg-background p-3">
          <input type="checkbox" checked={analysis} onChange={(event) => setAnalysis(event.target.checked)} className="h-5 w-5 accent-primary" />
          <span>質問ログが管理者により閲覧・分析されることに同意します</span>
        </label>
        <Button className="w-full" disabled={!canSave} onClick={saveConsent}>
          同意する
        </Button>
        {message ? <p className="rounded-md border border-accent bg-accent/10 p-3">{message}</p> : null}
        {saved ? <p className="text-xs text-muted-foreground">ログインユーザーID、同意種別、規約版、日時、IP、User-Agentを保存しました。</p> : null}
        <div className="flex justify-between text-primary">
          <Link href="/terms">利用規約</Link>
          <Link href="/privacy">プライバシーポリシー</Link>
          {saved ? <Link href="/dashboard">ホーム</Link> : null}
        </div>
      </CardContent>
    </Card>
  );
}
