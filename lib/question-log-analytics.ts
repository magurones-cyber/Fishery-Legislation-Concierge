export const questionLogAccessReasons = [
  "問い合わせ対応",
  "不具合調査",
  "FAQ改善",
  "研修テーマ抽出",
  "不足資料確認",
  "漁協支援",
  "事故・トラブル対応",
  "監査",
  "その他"
] as const;

export type QuestionLogAccessReason = (typeof questionLogAccessReasons)[number];

export const roleAccessMatrix = [
  { role: "一般利用者", aggregate: "不可", individual: "自分の質問履歴のみ" },
  { role: "漁協職員", aggregate: "不可", individual: "自分の質問履歴のみ" },
  { role: "漁協管理者", aggregate: "自所属のみ", individual: "自所属の必要な個別ログ" },
  { role: "自治体管理者", aggregate: "全体", individual: "全体の必要な個別ログ" },
  { role: "管理者", aggregate: "資料改善、FAQ改善、研修改善の範囲", individual: "目的に必要な個別ログ" },
  { role: "システム管理者", aggregate: "障害対応、監査目的", individual: "障害対応、監査目的の個別ログ" }
];

export const anonymizedQuestionLogSummary = {
  byCategory: [
    { label: "12_遊漁船・海洋レジャー・安全管理", count: 42, trend: "+8" },
    { label: "03_漁港・漁場・漁港施設等活用", count: 31, trend: "+5" },
    { label: "09_自治体財務・補助金", count: 24, trend: "+3" },
    { label: "04_漁協", count: 18, trend: "+2" }
  ],
  byOrganization: [
    { label: "自治体水産担当", count: 58, trend: "+11" },
    { label: "漁協A", count: 27, trend: "+4" },
    { label: "漁協B", count: 21, trend: "+1" },
    { label: "一般利用者", count: 16, trend: "-2" }
  ],
  byPeriod: [
    { label: "直近7日", count: 18, trend: "+4" },
    { label: "直近30日", count: 128, trend: "+18%" },
    { label: "前月", count: 109, trend: "+9%" },
    { label: "四半期", count: 342, trend: "+22%" }
  ],
  byConfidence: [
    { label: "高", count: 39, trend: "法令・条例根拠" },
    { label: "中", count: 52, trend: "通知・手引根拠" },
    { label: "低", count: 21, trend: "根拠不足" },
    { label: "要確認", count: 16, trend: "所管判断必要" }
  ],
  byMissingSource: [
    { label: "遊漁船業法関連資料", count: 12, trend: "追加登録候補" },
    { label: "漁港別利用許可基準", count: 9, trend: "自治体資料確認" },
    { label: "年度別補助金要綱", count: 7, trend: "更新確認" },
    { label: "漁協定款・規約例", count: 5, trend: "内部資料候補" }
  ],
  byFeedback: [
    { label: "役に立った", count: 67, trend: "+15" },
    { label: "一部修正が必要", count: 18, trend: "FAQ改善候補" },
    { label: "根拠不足", count: 11, trend: "資料追加候補" },
    { label: "情報が古い", count: 4, trend: "更新管理へ連携" }
  ]
};

export const anonymizedQuestionLogs = [
  {
    id: "qlog-001",
    maskedQuestion: "[船名]の遊漁船業者登録に必要な書類は何ですか。",
    category: "12_遊漁船・海洋レジャー・安全管理",
    organization: "漁協A",
    userLabel: "漁協職員-001",
    confidence: "要確認",
    missingSources: ["都道府県登録手続", "業務規程例"],
    feedback: "根拠不足",
    createdAt: "2026-06-14 09:12"
  },
  {
    id: "qlog-002",
    maskedQuestion: "漁港から遊漁船を出航させる場合の確認事項は何ですか。",
    category: "03_漁港・漁場・漁港施設等活用 / 12_遊漁船",
    organization: "自治体水産担当",
    userLabel: "自治体職員-004",
    confidence: "要確認",
    missingSources: ["漁港別施設利用基準"],
    feedback: "一部修正が必要",
    createdAt: "2026-06-14 10:05"
  },
  {
    id: "qlog-003",
    maskedQuestion: "補助対象経費に消費税を含めてよいですか。",
    category: "09_自治体財務・補助金",
    organization: "漁協B",
    userLabel: "漁協職員-018",
    confidence: "中",
    missingSources: ["年度別交付要綱"],
    feedback: "情報が古い",
    createdAt: "2026-06-13 15:40"
  }
];

export const individualQuestionLogs = [
  {
    id: "qlog-001",
    question: "山田丸の遊漁船業者登録に必要な書類は何ですか。連絡先は090-1234-5678です。",
    aiAnswer:
      "登録申請書、業務規程、遊漁船業務主任者に関する資料、損害賠償保険等の確認が必要です。ただし、都道府県の登録手続資料が不足しているため、所管部署への確認が必要です。",
    sources: [
      { title: "遊漁船業安全管理チェックメモ", article: "登録手続", page: 3, quote: "業務主任者、保険、業務規程を確認する。" },
      { title: "漁港用地及び施設利用相談 初期運用メモ", article: "出航利用", page: 5, quote: "漁港施設の利用形態と管理者確認を行う。" }
    ],
    confidence: "要確認",
    missingSources: ["都道府県登録手続", "業務規程例"],
    feedback: "根拠不足",
    user: "漁協職員-001",
    organization: "漁協A",
    createdAt: "2026-06-14 09:12"
  },
  {
    id: "qlog-002",
    question: "漁港から遊漁船を出航させる場合の確認事項は何ですか。",
    aiAnswer:
      "漁港区域、施設区分、利用許可、出航場所、安全管理、漁業者との利用調整を確認します。個別漁港の利用基準が不足しているため、漁港管理者への確認が必要です。",
    sources: [
      { title: "漁港用地及び施設利用相談 初期運用メモ", article: "漁港施設利用", page: 2, quote: "施設区分、目的外使用、占用、行為許可を確認する。" }
    ],
    confidence: "要確認",
    missingSources: ["漁港別施設利用基準"],
    feedback: "一部修正が必要",
    user: "自治体職員-004",
    organization: "自治体水産担当",
    createdAt: "2026-06-14 10:05"
  },
  {
    id: "qlog-003",
    question: "補助対象経費に消費税を含めてよいですか。",
    aiAnswer:
      "補助金の交付要綱、消費税仕入控除税額、実績報告時の返還要否を確認します。年度別交付要綱が未登録の場合は断定できません。",
    sources: [
      { title: "補助対象経費・消費税確認メモ", article: "消費税", page: 1, quote: "仕入控除税額の扱いと返還要否を確認する。" }
    ],
    confidence: "中",
    missingSources: ["年度別交付要綱"],
    feedback: "情報が古い",
    user: "漁協職員-018",
    organization: "漁協B",
    createdAt: "2026-06-13 15:40"
  }
];

export function findIndividualQuestionLog(id: string) {
  return individualQuestionLogs.find((log) => log.id === id);
}
