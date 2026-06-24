"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SourceCard } from "@/components/rag/source-card";
import { sourceTypeOptions } from "@/lib/rag/types";
import { categoryOptions, recreationalFishingBoatTagSuggestions } from "@/lib/rag/categories";
import type { SearchResult } from "@/lib/rag/types";

export function SearchPanel() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState("検索語を入力してください。");
  const [loading, setLoading] = useState(false);
  const [categoryCode, setCategoryCode] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setCategoryCode(searchParams.get("category") ?? "");
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setMessage("検索中です。");

    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: formData.get("query"),
        categoryId: formData.get("categoryId"),
        categoryCode,
        sourceType: formData.get("sourceType"),
        tag: formData.get("tag"),
        issuingAuthority: formData.get("issuingAuthority")
      })
    });
    const data = (await response.json()) as { results?: SearchResult[]; error?: string };
    setLoading(false);

    if (!response.ok || data.error) {
      setResults([]);
      setMessage(data.error ?? "検索できませんでした。");
      return;
    }

    setResults(data.results ?? []);
    setMessage((data.results?.length ?? 0) > 0 ? `${data.results?.length}件見つかりました。` : "根拠候補は見つかりませんでした。");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <Input name="query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="条文番号、資料名、キーワード" required />
          <Button size="icon" aria-label="検索" disabled={loading}>
            <Search className="h-5 w-5" aria-hidden />
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select name="sourceType" className="h-11 rounded-md border bg-background px-3 text-sm" defaultValue="">
            <option value="">資料種別すべて</option>
            {sourceTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <select
            name="categoryCode"
            className="h-11 rounded-md border bg-background px-3 text-sm"
            value={categoryCode}
            onChange={(event) => setCategoryCode(event.target.value)}
          >
            <option value="">カテゴリ自動判定</option>
            {categoryOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <Input name="tag" placeholder="タグ" />
        </div>
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <Input name="issuingAuthority" placeholder="所管" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {recreationalFishingBoatTagSuggestions.slice(0, 8).map((tag) => (
            <span key={tag} className="shrink-0 rounded-md border bg-card px-2 py-1 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </form>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="space-y-3">
        {results.map((result) => (
          <SourceCard key={result.chunk_id} source={result} />
        ))}
      </div>
    </div>
  );
}
