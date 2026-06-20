"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";

export function SetPasswordForm() {
  const router = useRouter();
  const [message, setMessage] = useState("8文字以上のパスワードを設定してください。");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    if (password.length < 8 || password !== confirmation) {
      setMessage("8文字以上で、同じパスワードを2回入力してください。");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage("パスワードを設定できませんでした。招待メールを開き直してください。");
      return;
    }
    router.replace("/consent");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input name="password" type="password" autoComplete="new-password" placeholder="新しいパスワード" minLength={8} required />
      <Input name="confirmation" type="password" autoComplete="new-password" placeholder="新しいパスワード（確認）" minLength={8} required />
      <Button className="w-full" disabled={loading}>
        <KeyRound className="h-4 w-4" aria-hidden />
        {loading ? "設定中" : "パスワードを設定"}
      </Button>
      <p className="rounded-md border bg-muted p-3 text-xs text-muted-foreground">{message}</p>
    </form>
  );
}
