"use client";

import { useState, type FormEvent } from "react";
import { MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const roleOptions = [
  ["general_user", "一般利用者"],
  ["fisheries_coop_staff", "漁協職員"],
  ["fisheries_coop_manager", "漁協管理者"],
  ["municipality_staff", "自治体職員"],
  ["municipality_manager", "自治体管理者"],
  ["admin", "管理者"],
  ["system_admin", "システム管理者"]
];

export function UserInviteForm() {
  const [message, setMessage] = useState("招待メールを送信し、所属organizationとロールを付与します。");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("招待処理中です。");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    const payload = await response.json().catch(() => null);
    setMessage(response.ok ? "招待を登録しました。メールの到達と初回同意を確認してください。" : payload?.error ?? "招待できませんでした。");
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input name="email" type="email" placeholder="メールアドレス" required />
      <Input name="displayName" placeholder="表示名" required />
      <Input name="organizationId" placeholder="organization_id" defaultValue={process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? ""} required />
      <select name="role" className="h-11 w-full rounded-md border bg-background px-3 text-sm" defaultValue="general_user">
        {roleOptions.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <Button className="w-full" disabled={loading}>
        <MailPlus className="h-4 w-4" aria-hidden />
        招待メールを送信
      </Button>
      <p className="rounded-md border bg-muted p-3 text-xs leading-relaxed text-muted-foreground">{message}</p>
    </form>
  );
}
