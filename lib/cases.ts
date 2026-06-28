import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ConsultationCase } from "@/lib/phase2-data";

type CaseRow = {
  id: string;
  case_number: string | null;
  title: string | null;
  consulted_at: string | null;
  consultation_category: string | null;
  requester: string | null;
  requester_type: string | null;
  district: string | null;
  municipality: string | null;
  coop_name: string | null;
  fishing_port: string | null;
  species: string | null;
  fishery_type: string | null;
  consultation_content: string | null;
  ai_answer: string | null;
  source_summary: unknown;
  assignee_name: string | null;
  status_label: string | null;
  next_action_date: string | null;
  due_date: string | null;
  stakeholders: string | null;
  internal_memo: string | null;
  tags: string[] | null;
  updated_at: string | null;
};

const caseFields = [
  "id",
  "case_number",
  "title",
  "consulted_at",
  "consultation_category",
  "requester",
  "requester_type",
  "district",
  "municipality",
  "coop_name",
  "fishing_port",
  "species",
  "fishery_type",
  "consultation_content",
  "ai_answer",
  "source_summary",
  "assignee_name",
  "status_label",
  "next_action_date",
  "due_date",
  "stakeholders",
  "internal_memo",
  "tags",
  "updated_at"
].join(", ");

export async function listCases(): Promise<{ cases: ConsultationCase[]; error: string | null }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("consultation_cases")
      .select(caseFields)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) return { cases: [], error: "相談履歴を読み込めませんでした。Supabase接続とRLSを確認してください。" };

    const cases = ((data ?? []) as unknown as CaseRow[]).map(mapCaseRow);
    return { cases, error: null };
  } catch {
    return { cases: [], error: "相談履歴を読み込めませんでした。ログイン状態、所属、ロールを確認してください。" };
  }
}

export async function getCase(id: string): Promise<{ record: ConsultationCase | null; isDatabaseRecord: boolean }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from("consultation_cases").select(caseFields).eq("id", id).is("deleted_at", null).maybeSingle();
    if (data) return { record: mapCaseRow(data as unknown as CaseRow), isDatabaseRecord: true };
  } catch {
    // Fall through to demo records.
  }

  return { record: null, isDatabaseRecord: false };
}

function mapCaseRow(row: CaseRow): ConsultationCase {
  return {
    id: row.id,
    caseNumber: row.case_number ?? "未設定",
    title: row.title ?? "無題の相談",
    consultedAt: row.consulted_at ?? "",
    category: row.consultation_category ?? "その他",
    requester: row.requester ?? "未設定",
    requesterType: row.requester_type ?? "未設定",
    district: row.district ?? "未設定",
    municipality: row.municipality ?? "未設定",
    coopName: row.coop_name ?? "未設定",
    fishingPort: row.fishing_port ?? "未設定",
    species: row.species ?? "未設定",
    fisheryType: row.fishery_type ?? "未設定",
    content: row.consultation_content ?? "",
    aiAnswer: row.ai_answer ?? "",
    sources: readSources(row.source_summary),
    assignee: row.assignee_name ?? "未設定",
    status: row.status_label ?? "未対応",
    nextActionDate: row.next_action_date ?? "未設定",
    dueDate: row.due_date ?? "未設定",
    stakeholders: row.stakeholders ?? "未設定",
    internalMemo: row.internal_memo ?? "",
    tags: row.tags ?? [],
    updatedAt: row.updated_at?.slice(0, 10) ?? ""
  };
}

function readSources(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "title" in item) return String(item.title);
      return "";
    })
    .filter(Boolean);
}
