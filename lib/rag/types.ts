export const sourceTypeOptions = [
  { value: "law", label: "法律" },
  { value: "cabinet_order", label: "政令" },
  { value: "ministerial_ordinance", label: "省令" },
  { value: "ordinance", label: "条例" },
  { value: "rule", label: "規則" },
  { value: "public_notice", label: "告示" },
  { value: "notification", label: "通知" },
  { value: "guideline", label: "ガイドライン" },
  { value: "outline", label: "要綱" },
  { value: "procedure_manual", label: "要領" },
  { value: "form", label: "様式" },
  { value: "procedure_guide", label: "手続案内" },
  { value: "safety_management_material", label: "安全管理資料" },
  { value: "training_material", label: "講習資料" },
  { value: "business_rules", label: "業務規程" },
  { value: "accident_report_material", label: "事故報告資料" },
  { value: "registration_application", label: "登録申請資料" },
  { value: "renewal_application", label: "更新申請資料" },
  { value: "internal_guidance", label: "内部指導資料" },
  { value: "consultation_case", label: "相談事例" },
  { value: "internal_memo", label: "内部運用資料" },
  { value: "faq", label: "FAQ" },
  { value: "case_record", label: "過去事例" },
  { value: "reference", label: "その他" }
] as const;

export const visibilityOptions = [
  { value: "public", label: "公開", rank: 0 },
  { value: "fisheries_coop_staff", label: "漁協職員以上", rank: 1 },
  { value: "municipality_staff", label: "自治体職員以上", rank: 2 },
  { value: "admin_only", label: "管理者のみ", rank: 3 }
] as const;

export type SourceType = (typeof sourceTypeOptions)[number]["value"];
export type Visibility = (typeof visibilityOptions)[number]["value"];
export type AudienceRole = "public" | "fisheries_coop_staff" | "municipality_staff" | "admin";

export type ExtractedPage = {
  pageNumber: number;
  text: string;
};

export type RagChunk = {
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  articleNumber: string | null;
  heading: string | null;
  content: string;
  citationText: string;
};

export type SearchResult = {
  chunk_id: string;
  document_id: string;
  document_version_id: string;
  title: string;
  source_type: string;
  document_number: string | null;
  issuing_authority: string | null;
  last_amended_at: string | null;
  visibility: Visibility;
  category_name: string | null;
  category_code?: string | null;
  article_number: string | null;
  page_start: number | null;
  page_end: number | null;
  heading: string | null;
  content: string;
  citation_text: string | null;
  score: number;
  result_kind?: "chunk" | "metadata";
  processing_status?: string;
};

export function sourceTypeLabel(value: string) {
  return sourceTypeOptions.find((option) => option.value === value)?.label ?? value;
}

export function visibilityLabel(value: string) {
  return visibilityOptions.find((option) => option.value === value)?.label ?? value;
}

export type RagAnswer = {
  answer: string;
  confidence: "高" | "中" | "低" | "要確認";
  missingSources: string[];
  sources: SearchResult[];
};
