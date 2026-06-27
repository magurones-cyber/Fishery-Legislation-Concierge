import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type RecentQuestion = {
  id: string;
  title: string;
  createdAt: string;
  confidence: string | null;
};

export async function listRecentQuestions(limit = 5): Promise<{ questions: RecentQuestion[]; error: string | null }> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("qa_sessions")
    .select("id, title, created_at, confidence_level")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { questions: [], error: "質問履歴を読み込めませんでした。" };

  return {
    questions: (data ?? [])
      .filter((row) => typeof row.title === "string" && row.title.trim())
      .map((row) => ({
        id: String(row.id),
        title: String(row.title),
        createdAt: String(row.created_at),
        confidence: typeof row.confidence_level === "string" ? row.confidence_level : null
      })),
    error: null
  };
}
