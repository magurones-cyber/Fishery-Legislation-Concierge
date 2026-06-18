"use client";

import { useState, type FormEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sourceTypeOptions, visibilityOptions } from "@/lib/rag/types";
import { categoryOptions, recreationalFishingBoatSubcategories, recreationalFishingBoatTagSuggestions } from "@/lib/rag/categories";

type UploadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string; documentId: string }
  | { status: "error"; message: string };

export function DocumentUploadForm() {
  const [state, setState] = useState<UploadState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState({ status: "loading" });

    const response = await fetch("/api/admin/documents", {
      method: "POST",
      body: formData
    });
    const data = (await response.json()) as { error?: string; documentId?: string; status?: string; chunks?: number; embeddings?: number; warning?: string };

    if (!response.ok || data.error || !data.documentId) {
      setState({ status: "error", message: data.error ?? "登録に失敗しました。" });
      return;
    }

    setState({
      status: "success",
      documentId: data.documentId,
      message: `登録完了: ${data.status} / チャンク ${data.chunks ?? 0} / Embedding ${data.embeddings ?? 0}${data.warning ? ` / ${data.warning}` : ""}`
    });
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input name="title" placeholder="資料名" required />
      <div className="grid grid-cols-2 gap-2">
        <select name="categoryCode" className="h-11 rounded-md border bg-background px-3 text-sm" defaultValue="12">
          {categoryOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        <select name="subcategoryCode" className="h-11 rounded-md border bg-background px-3 text-sm" defaultValue="">
          <option value="">サブカテゴリなし</option>
          {recreationalFishingBoatSubcategories.map((name) => (
            <option key={name} value={`12-${name}`}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <Input name="categoryId" placeholder="カテゴリIDで直接指定（任意）" />
      <div className="grid grid-cols-2 gap-2">
        <select name="sourceType" className="h-11 rounded-md border bg-background px-3 text-sm">
          {sourceTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select name="visibility" className="h-11 rounded-md border bg-background px-3 text-sm" defaultValue="admin_only">
          {visibilityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input name="documentNumber" placeholder="法令番号" />
        <Input name="issuingAuthority" placeholder="所管" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input name="effectiveDate" type="date" aria-label="施行日" />
        <Input name="lastAmendedAt" type="date" aria-label="最終改正日" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input name="acquiredAt" type="date" aria-label="取得日" />
        <Input name="updateCycle" placeholder="更新周期" />
      </div>
      <Input name="sourceUrl" placeholder="取得元URL" />
      <Input name="tags" placeholder={`タグ（例：${recreationalFishingBoatTagSuggestions.slice(0, 4).join(", ")}）`} />
      <Textarea name="notes" placeholder="備考" className="min-h-20 text-sm" />
      <label className="block rounded-md border bg-background p-3 text-sm">
        <span className="mb-2 block font-medium">ファイル（PDF / TXT / Markdown）</span>
        <input name="file" type="file" accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown" required className="w-full text-sm" />
      </label>
      <Button className="w-full" disabled={state.status === "loading"}>
        <Upload className="h-4 w-4" aria-hidden />
        {state.status === "loading" ? "登録・抽出中" : "資料を登録して検索可能にする"}
      </Button>
      {state.status === "success" ? <p className="rounded-md border border-accent bg-accent/10 p-3 text-sm">{state.message}</p> : null}
      {state.status === "error" ? <p className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm">{state.message}</p> : null}
    </form>
  );
}
