import type { SearchResult } from "@/lib/rag/types";

const highTypes = new Set(["law", "cabinet_order", "ministerial_ordinance", "ordinance", "rule"]);
const mediumTypes = new Set(["public_notice", "notification", "guideline", "outline", "procedure_manual", "internal_memo"]);

export function estimateConfidence(sources: SearchResult[]) {
  if (sources.length === 0) return "低";
  if (sources.some((source) => highTypes.has(source.source_type))) return "高";
  if (sources.some((source) => mediumTypes.has(source.source_type))) return "中";
  return "要確認";
}
