"use client";

import { useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sourceTypeOptions, visibilityOptions } from "@/lib/rag/types";
import { categoryOptions, recreationalFishingBoatSubcategories, recreationalFishingBoatTagSuggestions } from "@/lib/rag/categories";

type UploadResult = {
  documentId?: string;
  fileName: string;
  title?: string;
  status?: string;
  categoryCode?: string;
  autoCategory?: boolean;
  chunks?: number;
  embeddings?: number;
  warning?: string | null;
  error?: string;
};

type UploadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; results: UploadResult[] }
  | { status: "error"; message: string };

export function DocumentUploadForm() {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  function addFiles(nextFiles: FileList | File[]) {
    const allowed = Array.from(nextFiles).filter((file) => /\.(pdf|txt|md|markdown)$/i.test(file.name) || ["application/pdf", "text/plain", "text/markdown"].includes(file.type));
    setFiles((current) => {
      const existing = new Set(current.map((file) => `${file.name}:${file.size}`));
      return [...current, ...allowed.filter((file) => !existing.has(`${file.name}:${file.size}`))];
    });
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) {
      setState({ status: "error", message: "ファイルを選択してください。" });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.delete("files");
    for (const file of files) {
      formData.append("files", file);
    }
    setState({ status: "loading" });

    const response = await fetch("/api/admin/documents", {
      method: "POST",
      body: formData
    });
    const data = (await response.json()) as { error?: string; results?: UploadResult[] } & UploadResult;

    if (!response.ok || data.error) {
      setState({ status: "error", message: data.error ?? "登録に失敗しました。" });
      return;
    }

    setState({ status: "done", results: data.results ?? [data] });
    setFiles([]);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input name="title" placeholder="資料名（複数登録時は未入力ならファイル名を使用）" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex h-11 items-center gap-2 rounded-md border bg-background px-3 text-sm">
          <input name="categoryMode" type="checkbox" value="auto" defaultChecked className="h-4 w-4 accent-primary" />
          PDF/TXT内容からカテゴリ自動判定
        </label>
        <select name="categoryCode" className="h-11 rounded-md border bg-background px-3 text-sm" defaultValue="99">
          {categoryOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <select name="subcategoryCode" className="h-11 w-full rounded-md border bg-background px-3 text-sm" defaultValue="">
        <option value="">サブカテゴリなし</option>
        {recreationalFishingBoatSubcategories.map((name) => (
          <option key={name} value={`12-${name}`}>
            {name}
          </option>
        ))}
      </select>
      <Input name="categoryId" placeholder="カテゴリIDで直接指定（任意）" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input name="documentNumber" placeholder="法令番号" />
        <Input name="issuingAuthority" placeholder="所管" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input name="effectiveDate" type="date" aria-label="施行日" />
        <Input name="lastAmendedAt" type="date" aria-label="最終改正日" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input name="acquiredAt" type="date" aria-label="取得日" />
        <Input name="updateCycle" placeholder="更新周期" />
      </div>
      <Input name="sourceUrl" placeholder="取得元URL" />
      <Input name="tags" placeholder={`タグ（例：${recreationalFishingBoatTagSuggestions.slice(0, 4).join(", ")}）`} />
      <Textarea name="notes" placeholder="備考" className="min-h-20 text-sm" />
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={dragging ? "block rounded-md border border-primary bg-primary/10 p-4 text-sm" : "block rounded-md border bg-background p-4 text-sm"}
      >
        <span className="mb-2 block font-medium">ファイル（PDF / TXT / Markdown、複数可）</span>
        <span className="mb-3 block text-xs text-muted-foreground">ここへドラッグ&ドロップ、またはファイルを選択してください。</span>
        <input name="files" type="file" accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown" multiple className="w-full text-sm" onChange={(event) => event.target.files && addFiles(event.target.files)} />
      </label>
      {files.length > 0 ? (
        <div className="space-y-2 rounded-md border bg-muted p-3 text-sm">
          <p className="font-medium">登録待ちファイル {files.length}件</p>
          {files.map((file) => (
            <div key={`${file.name}:${file.size}`} className="flex items-center justify-between gap-2 rounded-md bg-background p-2">
              <span className="min-w-0 break-words text-xs">{file.name}</span>
              <button type="button" className="shrink-0 rounded-md p-1 active:bg-muted" onClick={() => setFiles((current) => current.filter((item) => item !== file))} aria-label={`${file.name}を除外`}>
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <Button className="w-full" disabled={state.status === "loading"}>
        <Upload className="h-4 w-4" aria-hidden />
        {state.status === "loading" ? "登録・抽出中" : "資料を一括登録して検索可能にする"}
      </Button>
      {state.status === "done" ? <UploadResults results={state.results} /> : null}
      {state.status === "error" ? <p className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm">{state.message}</p> : null}
    </form>
  );
}

function UploadResults({ results }: { results: UploadResult[] }) {
  return (
    <div className="space-y-2 rounded-md border bg-card p-3 text-sm">
      <p className="font-medium">登録結果</p>
      {results.map((result) => {
        const searchable = result.status === "searchable";
        return (
          <div key={`${result.fileName}:${result.documentId ?? result.error}`} className={searchable ? "rounded-md border border-accent bg-accent/10 p-3" : "rounded-md border border-secondary bg-secondary/10 p-3"}>
            <p className="flex items-start gap-2">
              {searchable ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
              <span className="min-w-0 break-words">
                {result.title ?? result.fileName} / 状態: {result.status ?? "failed"} / カテゴリ: {result.categoryCode ?? "未設定"} / チャンク {result.chunks ?? 0}件
              </span>
            </p>
            {result.warning || result.error ? <p className="mt-2 text-xs text-muted-foreground">{result.warning ?? result.error}</p> : null}
            {result.documentId ? (
              <Link href={`/admin/documents/${result.documentId}`} className="mt-2 inline-flex items-center gap-1 font-medium text-primary">
                <ExternalLink className="h-4 w-4" aria-hidden />
                登録資料を編集
              </Link>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
