import { ADMIN_ROLES } from "@/lib/auth";

export const CASE_EDITOR_ROLES = ["fisheries_coop_staff", "fisheries_coop_manager", "municipality_staff", "municipality_manager", ...ADMIN_ROLES] as const;

export function buildCasePayload(body: unknown, organizationId: string) {
  const source = typeof body === "object" && body ? (body as Record<string, unknown>) : {};
  const tags = readString(source.tags)
    .split(/[,\n、]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    organization_id: organizationId,
    case_number: readString(source.caseNumber) || `CASE-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`,
    title: readString(source.title),
    status_label: readString(source.status) || "未対応",
    consultation_category: readString(source.category) || "その他",
    consulted_at: readDate(source.consultedAt),
    requester: readString(source.requester),
    requester_type: readString(source.requesterType),
    district: readString(source.district),
    municipality: readString(source.municipality),
    coop_name: readString(source.coopName),
    fishing_port: readString(source.fishingPort),
    species: readString(source.species),
    fishery_type: readString(source.fisheryType),
    consultation_content: readString(source.content),
    ai_answer: readString(source.aiAnswer),
    assignee_name: readString(source.assignee),
    next_action_date: readDate(source.nextActionDate),
    due_date: readDate(source.dueDate),
    stakeholders: readString(source.stakeholders),
    internal_memo: readString(source.internalMemo),
    tags,
    updated_at: new Date().toISOString()
  };
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readDate(value: unknown) {
  const text = readString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}
