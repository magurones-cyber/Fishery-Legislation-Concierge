"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function QuestionEntry() {
  const router = useRouter();
  const [question, setQuestion] = useState("");

  function navigate(event: FormEvent<HTMLFormElement>, destination: "ask" | "search") {
    event.preventDefault();
    const query = question.trim();
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (destination === "ask" && query) {
      params.set("auto", "1");
    }
    const suffix = params.toString() ? `?${params.toString()}` : "";
    router.push(`/${destination}${suffix}`);
  }

  return (
    <div className="rounded-md border bg-card p-3 shadow-sm">
      <Textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="例：漁港用地で試験的な陸上養殖を実施できますか？"
        aria-label="質問または検索内容"
        className="min-h-32 resize-y"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
        <form onSubmit={(event) => navigate(event, "ask")}>
          <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm active:scale-[0.99]">
            <Send className="h-4 w-4" aria-hidden />
            質問する
          </button>
        </form>
        <form onSubmit={(event) => navigate(event, "search")}>
          <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium active:bg-muted">
            <Search className="h-4 w-4" aria-hidden />
            資料を検索
          </button>
        </form>
      </div>
    </div>
  );
}
