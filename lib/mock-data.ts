export type Category = {
  code: string;
  name: string;
  description: string;
  parentCode?: string;
};

export type DocumentRecord = {
  id: string;
  title: string;
  categoryCode: string;
  sourceType: string;
  legalEffect: string;
  updatedAt: string;
  pageCount: number;
  summary: string;
  citations: string[];
};

export const categories: Category[] = [
  { code: "01", name: "水産政策・基本法", description: "水産基本法、国の基本計画、政策通知" },
  { code: "02", name: "漁業制度・資源管理", description: "漁業権、許可、採捕、資源管理" },
  { code: "03", name: "漁港・漁場・漁港施設等活用", description: "漁港区域、施設、用地、財産管理、許認可、漁港施設等活用" },
  { code: "04", name: "漁協", description: "水産業協同組合法、定款、員外利用、指導" },
  { code: "05", name: "漁船・安全・無線", description: "漁船登録、改造、機関換装、安全設備、無線" },
  { code: "06", name: "経営支援・融資・共済", description: "経営安定、制度資金、共済、収入安定" },
  { code: "07", name: "養殖・防疫・環境", description: "養殖施設、排水、防疫、環境手続" },
  { code: "08", name: "市場・流通・食品衛生", description: "産地市場、流通、衛生管理、表示" },
  { code: "09", name: "自治体財務・補助金", description: "補助金、交付要綱、財務規則、検査" },
  { code: "10", name: "地域振興・浜プラン・海業", description: "浜プラン、地域振興、観光連携" },
  { code: "11", name: "相談事例・運用メモ", description: "内部運用、FAQ、過去相談、判断メモ" },
  { code: "12", name: "遊漁船・海洋レジャー・安全管理", description: "遊漁船業登録、業務主任者、安全管理、保険、事故報告、漁場利用調整" },
  { code: "99", name: "経過措置・参考資料", description: "旧制度、参考資料、経過措置" }
];

export const documents: DocumentRecord[] = [
  {
    id: "doc-fishing-port-use",
    title: "漁港用地及び施設利用相談 初期運用メモ",
    categoryCode: "03",
    sourceType: "内部資料",
    legalEffect: "内部運用資料。法令解釈の根拠は関連法令を併記すること。",
    updatedAt: "2026-06-01",
    pageCount: 12,
    summary: "漁港用地での試験利用、占用、目的外使用に関する相談受付時の確認項目。",
    citations: ["p.3 試験利用の事前確認項目", "p.7 関係部署照会フロー"]
  },
  {
    id: "doc-coop-member",
    title: "漁協運営・組合員資格 FAQ",
    categoryCode: "04",
    sourceType: "FAQ",
    legalEffect: "FAQ。最終判断は法令、定款、所管庁通知を確認すること。",
    updatedAt: "2026-05-20",
    pageCount: 8,
    summary: "正組合員資格、准組合員、員外利用、総会手続に関するよくある質問。",
    citations: ["Q2 正組合員資格の確認", "Q6 員外利用の記録"]
  },
  {
    id: "doc-subsidy-check",
    title: "水産関係補助金 申請前チェックリスト",
    categoryCode: "09",
    sourceType: "手引",
    legalEffect: "事務手引。交付要綱及び自治体財務規則を優先する。",
    updatedAt: "2026-04-15",
    pageCount: 16,
    summary: "補助対象経費、見積徴取、着手時期、実績報告の確認手順。",
    citations: ["p.5 着手前確認", "p.10 証憑整理"]
  }
];

export const recentQuestions = [
  "漁業者が遊漁船業を兼業する場合、どのような手続が必要ですか。",
  "漁港用地で試験的な陸上養殖を実施できますか？",
  "准組合員の市場利用に制限はありますか？",
  "漁船の機関換装で補助対象になる経費は何ですか？"
];

export const menuItems = [
  "漁港利用",
  "漁協運営",
  "漁業権・採捕",
  "漁船",
  "遊漁船",
  "補助金",
  "融資・共済",
  "養殖",
  "市場・衛生",
  "相談記録"
];
