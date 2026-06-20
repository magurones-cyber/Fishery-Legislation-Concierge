"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Link as LinkIcon, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("管理者から招待されたメールアドレスでログインしてください。");
  const [loading, setLoading] = useState(false);

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("ログイン中です。");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage("ログインできませんでした。招待済みメールとパスワードを確認してください。");
      } else {
        const requestedNext = searchParams.get("next");
        const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
        setMessage("ログインしました。");
        router.replace(next);
        router.refresh();
      }
    } catch {
      setMessage("Supabase環境変数が未設定です。運営者がProjectと環境変数を設定してください。");
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    setLoading(true);
    setMessage("マジックリンクを送信しています。");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/consent` : undefined
        }
      });
      setMessage(error ? "マジックリンクを送信できませんでした。招待済みメールか確認してください。" : "マジックリンクを送信しました。メールからログインしてください。");
    } catch {
      setMessage("Supabase環境変数が未設定です。運営者がProjectと環境変数を設定してください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={signInWithPassword} className="space-y-3">
      <Input type="email" placeholder="招待済みメールアドレス" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <Input type="password" placeholder="パスワード" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <Button className="w-full" disabled={loading || !email || !password}>
        <LogIn className="h-4 w-4" aria-hidden />
        メール・パスワードでログイン
      </Button>
      <Button type="button" variant="outline" className="w-full" disabled={loading || !email} onClick={sendMagicLink}>
        <LinkIcon className="h-4 w-4" aria-hidden />
        マジックリンクを送信
      </Button>
      <p className="flex gap-2 rounded-md border bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {message}
      </p>
    </form>
  );
}
