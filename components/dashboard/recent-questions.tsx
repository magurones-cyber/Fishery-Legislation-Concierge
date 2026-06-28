"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { RecentQuestion } from "@/lib/question-history";

type LocalRecentQuestion = {
  id: string;
  title: string;
  createdAt: string;
};

const STORAGE_KEY = "fishery-law-recent-questions";

export function rememberRecentQuestion(title: string) {
  if (typeof window === "undefined") return;
  const trimmed = title.trim();
  if (!trimmed) return;

  const current = readLocalQuestions();
  const next = [
    {
      id: `local-${Date.now()}`,
      title: trimmed.slice(0, 160),
      createdAt: new Date().toISOString()
    },
    ...current.filter((question) => question.title !== trimmed)
  ].slice(0, 10);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function RecentQuestions({
  initialQuestions,
  error
}: {
  initialQuestions: RecentQuestion[];
  error: string | null;
}) {
  const [localQuestions, setLocalQuestions] = useState<LocalRecentQuestion[]>([]);

  useEffect(() => {
    setLocalQuestions(readLocalQuestions());
  }, []);

  const questions = useMemo(() => {
    const byTitle = new Map<string, LocalRecentQuestion | RecentQuestion>();
    [...localQuestions, ...initialQuestions].forEach((question) => {
      const key = question.title.trim();
      if (key && !byTitle.has(key)) byTitle.set(key, question);
    });
    return Array.from(byTitle.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [initialQuestions, localQuestions]);

  return (
    <div className="space-y-2">
      {error ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">{error}</p> : null}
      {!error && questions.length === 0 ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">まだ質問履歴はありません。ホームの入力欄から質問すると、ここに表示されます。</p> : null}
      {questions.map((question) => (
        <Link key={question.id} href={`/ask?q=${encodeURIComponent(question.title)}&auto=1`} className="flex min-w-0 items-center justify-between gap-2 rounded-md border bg-card p-3">
          <span className="min-w-0 break-words text-sm leading-snug">{question.title}</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      ))}
    </div>
  );
}

function readLocalQuestions(): LocalRecentQuestion[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is LocalRecentQuestion => typeof item?.id === "string" && typeof item?.title === "string" && typeof item?.createdAt === "string")
      .slice(0, 10);
  } catch {
    return [];
  }
}
