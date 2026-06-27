"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sourceTypeOptions, visibilityOptions, type Visibility } from "@/lib/rag/types";

type EditableDocument = {
  id: string;
  title: string;
  sourceType: string;
  legalEffect: string;
  issuingAuthority: string | null;
  documentNumber: string | null;
  effectiveDate: string | null;
  lastAmendedAt: string | null;
  sourceUrl: string | null;
  visibility: Visibility;
  updateCycle?: string | null;
  notes: string | null;
  nextCheckedAt: string | null;
};

export function DocumentEditForm({ document }: { document: EditableDocument }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/documents/${document.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!response.ok || data.error) {
      setMessage(data.error ?? "更新に失敗しました。");
      return;
    }
    setMessage("資料情報を更新しました。");
    router.refresh();
  }

  async function remove() {
    const reason = window.prompt("削除理由を入力してください。", "誤登録のため");
    if (reason === null) return;
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/documents/${document.id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason })
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!response.ok || data.error) {
      setMessage(data.error ?? "削除に失敗しました。");
      return;
    }
    router.push("/admin/documents");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <Input name="title" defaultValue={document.title} placeholder="資料名" required />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select name="sourceType" className="h-11 rounded-md border bg-background px-3 text-sm" defaultValue={document.sourceType}>
          {sourceTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select name="visibility" className="h-11 rounded-md border bg-background px-3 text-sm" defaultValue={document.visibility}>
          {visibilityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Textarea name="legalEffect" defaultValue={document.legalEffect} placeholder="法的効力・実務上の位置づけ" className="min-h-20" required />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input name="documentNumber" defaultValue={document.documentNumber ?? ""} placeholder="法令番号" />
        <Input name="issuingAuthority" defaultValue={document.issuingAuthority ?? ""} placeholder="所管" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input name="effectiveDate" type="date" defaultValue={document.effectiveDate ?? ""} aria-label="施行日" />
        <Input name="lastAmendedAt" type="date" defaultValue={document.lastAmendedAt ?? ""} aria-label="最終改正日" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input name="updateCycle" defaultValue={document.updateCycle ?? ""} placeholder="更新周期" />
        <Input name="nextCheckedAt" type="date" defaultValue={document.nextCheckedAt ?? ""} aria-label="次回確認日" />
      </div>
      <Input name="sourceUrl" defaultValue={document.sourceUrl ?? ""} placeholder="取得元URL" />
      <Textarea name="notes" defaultValue={document.notes ?? ""} placeholder="備考" className="min-h-20" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4" aria-hidden />
          {loading ? "保存中" : "編集内容を保存"}
        </Button>
        <Button type="button" variant="destructive" disabled={loading} onClick={remove}>
          <Trash2 className="h-4 w-4" aria-hidden />
          誤登録を削除
        </Button>
      </div>
      {message ? <p className="rounded-md border bg-muted p-3 text-sm">{message}</p> : null}
    </form>
  );
}
