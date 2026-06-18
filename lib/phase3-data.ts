export const documentStates = ["下書き", "確認待ち", "公開", "旧版", "廃止"] as const;

export type ManagedDocument = {
  id: string;
  title: string;
  version: string;
  sourceType: string;
  effectiveDate: string;
  lastAmendedAt: string;
  acquiredAt: string;
  sourceUrl: string;
  updateOwner: string;
  updateReason: string;
  updateCycle: string;
  lastCheckedAt: string;
  nextCheckedAt: string;
  hasAmendment: boolean;
  impactedFaq: string[];
  impactedPrompts: string[];
  impactedCases: string[];
  impactScope: string;
  visibility: string;
  state: (typeof documentStates)[number];
  oldText: string;
  newText: string;
  deletedAt?: string;
};

export const managedDocuments: ManagedDocument[] = [
  {
    id: "doc-port-use",
    title: "漁港用地及び施設利用相談 初期運用メモ",
    version: "v2.1",
    sourceType: "内部運用資料",
    effectiveDate: "2026-06-01",
    lastAmendedAt: "2026-06-10",
    acquiredAt: "2026-06-14",
    sourceUrl: "https://example.local/port-use",
    updateOwner: "水産担当",
    updateReason: "漁港施設等活用制度の相談項目を追加",
    updateCycle: "3か月",
    lastCheckedAt: "2026-06-10",
    nextCheckedAt: "2026-06-30",
    hasAmendment: true,
    impactedFaq: ["漁港用地で試験的な陸上養殖を実施できますか。"],
    impactedPrompts: ["漁港利用案件プロンプト"],
    impactedCases: ["CASE-2026-0002"],
    impactScope: "漁港利用、占用、目的外使用、補助金財産処分",
    visibility: "自治体職員以上",
    state: "公開",
    oldText: "漁港用地の試験利用は、用地利用計画、目的外使用、排水を確認する。",
    newText: "漁港用地の試験利用は、用地利用計画、目的外使用、排水、民間貸付け、公募又は公告、補助金財産処分を確認する。"
  },
  {
    id: "doc-yugyosen",
    title: "遊漁船業安全管理チェックメモ",
    version: "v1.0",
    sourceType: "内部指導資料",
    effectiveDate: "2026-06-14",
    lastAmendedAt: "2026-06-14",
    acquiredAt: "2026-06-14",
    sourceUrl: "https://example.local/yugyosen",
    updateOwner: "漁船安全担当",
    updateReason: "遊漁船業兼業相談への対応",
    updateCycle: "1か月",
    lastCheckedAt: "2026-06-14",
    nextCheckedAt: "2026-07-14",
    hasAmendment: false,
    impactedFaq: ["漁業者が遊漁船業を兼業する場合、どのような手続が必要ですか。"],
    impactedPrompts: ["遊漁船業者登録相談メモ"],
    impactedCases: ["CASE-2026-0001"],
    impactScope: "登録、主任者、保険、業務規程、安全説明",
    visibility: "漁協職員以上",
    state: "確認待ち",
    oldText: "遊漁船業の登録、主任者、保険を確認する。",
    newText: "遊漁船業の登録、主任者、業務規程、損害賠償保険、安全説明、事故時連絡体制を確認する。"
  },
  {
    id: "doc-subsidy",
    title: "補助対象経費・消費税確認メモ",
    version: "v1.4",
    sourceType: "内部運用資料",
    effectiveDate: "2025-04-01",
    lastAmendedAt: "2025-04-01",
    acquiredAt: "2026-03-31",
    sourceUrl: "https://example.local/subsidy",
    updateOwner: "補助金担当",
    updateReason: "年度更新確認待ち",
    updateCycle: "年度",
    lastCheckedAt: "2026-03-31",
    nextCheckedAt: "2026-05-31",
    hasAmendment: false,
    impactedFaq: ["補助対象経費に消費税を含めてよいですか。"],
    impactedPrompts: ["補助金審査メモ"],
    impactedCases: [],
    impactScope: "補助金審査、消費税、実績報告",
    visibility: "自治体職員以上",
    state: "公開",
    oldText: "補助対象経費の消費税は、要綱と税務処理を確認する。",
    newText: "補助対象経費の消費税は、交付要綱、消費税仕入控除税額、実績報告、返還条件を確認する。"
  }
];

export const updateNotifications = [
  {
    id: "notice-port",
    title: "重要資料が更新されました。",
    documentTitle: "漁港用地及び施設利用相談 初期運用メモ",
    amendedAt: "2026-06-10",
    effectiveDate: "2026-06-01",
    summary: "民間貸付け、公募又は公告、補助金財産処分の確認項目を追加しました。",
    impact: "漁港利用相談、海業、試験養殖、施設貸付け",
    owner: "水産担当"
  }
];

export const auditLogs = [
  { id: "log-001", at: "2026-06-14 10:05", user: "自治体 水産担当", action: "AI回答", target: "CASE-2026-0001", ipAddress: "192.0.2.10", result: "成功" },
  { id: "log-002", at: "2026-06-14 10:12", user: "漁協 職員", action: "資料検索", target: "遊漁船業安全管理チェックメモ", ipAddress: "192.0.2.22", result: "成功" },
  { id: "log-003", at: "2026-06-14 10:18", user: "管理者", action: "資料更新", target: "漁港用地及び施設利用相談 初期運用メモ", ipAddress: "192.0.2.30", result: "成功" },
  { id: "log-004", at: "2026-06-14 10:22", user: "管理者", action: "権限変更", target: "漁協 職員", ipAddress: "192.0.2.30", result: "成功" },
  { id: "log-005", at: "2026-06-14 10:30", user: "自治体 水産担当", action: "文書出力", target: "漁協向け指導メモ", ipAddress: "192.0.2.10", result: "成功" }
];

export const promptTemplates = [
  { id: "prompt-rag", name: "根拠付きAI回答", version: 2, status: "公開", owner: "管理者", updatedAt: "2026-06-14" },
  { id: "prompt-port", name: "漁港利用案件", version: 1, status: "確認待ち", owner: "水産担当", updatedAt: "2026-06-14" },
  { id: "prompt-subsidy", name: "補助金審査メモ", version: 1, status: "公開", owner: "補助金担当", updatedAt: "2026-06-14" }
];

export const maskingSettings = [
  { key: "person_name", label: "氏名", enabled: true },
  { key: "phone", label: "電話番号", enabled: true },
  { key: "email", label: "メールアドレス", enabled: true },
  { key: "address", label: "住所", enabled: true },
  { key: "bank_account", label: "口座情報", enabled: true },
  { key: "business_name", label: "個別事業者名", enabled: true },
  { key: "private_case", label: "非公開案件名", enabled: true },
  { key: "vessel_name", label: "船名", enabled: true },
  { key: "registration_number", label: "登録番号", enabled: true }
];

export const adminOperations = [
  "ログイン",
  "ログアウト",
  "質問",
  "AI回答",
  "資料検索",
  "資料閲覧",
  "資料登録",
  "資料更新",
  "資料削除",
  "案件登録",
  "案件更新",
  "文書生成",
  "文書出力",
  "ユーザー追加",
  "権限変更",
  "設定変更",
  "ログ検索"
];

export function isUpdateOverdue(document: ManagedDocument) {
  return new Date(`${document.nextCheckedAt}T23:59:59+09:00`).getTime() < Date.now();
}

export function diffLines(oldText: string, newText: string) {
  const oldLines = oldText.split(/(?<=。)/).filter(Boolean);
  const newLines = newText.split(/(?<=。)/).filter(Boolean);
  const rows: Array<{ type: "追加" | "削除" | "変更なし"; text: string }> = [];

  for (const line of oldLines) {
    if (!newLines.includes(line)) {
      rows.push({ type: "削除", text: line });
    }
  }
  for (const line of newLines) {
    rows.push({ type: oldLines.includes(line) ? "変更なし" : "追加", text: line });
  }

  return rows;
}

export function answerSafetyWarnings(sources: Array<{ state?: string; visibility?: string; nextCheckedAt?: string; hasCitation?: boolean; sourceType?: string }>) {
  const warnings: string[] = [];
  if (sources.length === 0) warnings.push("根拠資料がありません。回答は断定できません。");
  if (sources.length > 0 && sources.every((source) => source.state === "旧版")) warnings.push("旧版資料のみを根拠にしています。最新版確認が必要です。");
  if (sources.some((source) => source.nextCheckedAt && new Date(`${source.nextCheckedAt}T23:59:59+09:00`).getTime() < Date.now())) warnings.push("更新期限切れ資料が根拠に含まれます。");
  if (sources.length > 0 && sources.every((source) => source.visibility?.includes("内部"))) warnings.push("内部資料のみに基づく回答です。上位法令や所管確認が必要です。");
  if (sources.some((source) => source.hasCitation === false)) warnings.push("引用がない文章が含まれます。根拠リンクを確認してください。");
  return warnings;
}

export const dashboardUpdatedDocuments = managedDocuments.map((document) => ({
  id: document.id,
  title: document.title,
  sourceType: document.sourceType,
  updatedAt: document.lastAmendedAt,
  legalEffect: document.visibility,
  summary: document.impactScope,
  citations: [`${document.version} / ${document.updateReason}`]
}));

export const phase3Documents = dashboardUpdatedDocuments;
