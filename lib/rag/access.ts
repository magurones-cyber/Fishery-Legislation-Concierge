import type { AudienceRole, Visibility } from "@/lib/rag/types";

const roleRank: Record<AudienceRole, number> = {
  public: 0,
  fisheries_coop_staff: 1,
  municipality_staff: 2,
  admin: 3
};

const visibilityRank: Record<Visibility, number> = {
  public: 0,
  fisheries_coop_staff: 1,
  municipality_staff: 2,
  admin_only: 3
};

export function canReadVisibility(role: AudienceRole, visibility: Visibility) {
  return roleRank[role] >= visibilityRank[visibility];
}

export function readableVisibilityValues(role: AudienceRole): Visibility[] {
  return (Object.keys(visibilityRank) as Visibility[]).filter((visibility) => canReadVisibility(role, visibility));
}
