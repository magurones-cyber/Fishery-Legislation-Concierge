export const userRoles = [
  { key: "general_user", label: "一般利用者", permissions: ["公開資料の検索", "質問", "お気に入り"] },
  { key: "fisheries_coop_staff", label: "漁協職員", permissions: ["相談記録", "漁業者指導記録"] },
  { key: "municipality_staff", label: "自治体職員", permissions: ["漁協指導記録", "内部メモ", "案件管理"] },
  { key: "admin", label: "管理者", permissions: ["資料登録", "更新", "カテゴリ管理", "ユーザー管理"] },
  { key: "system_admin", label: "システム管理者", permissions: ["全権限", "ログ", "設定"] }
];

export const caseCategories = [
  "漁協運営",
  "組合員資格",
  "員外利用",
  "漁港利用",
  "漁業権",
  "採捕",
  "許可漁業",
  "漁船",
  "安全操業",
  "補助金",
  "融資",
  "共済",
  "養殖",
  "防疫",
  "排水",
  "市場",
  "衛生管理",
  "流通",
  "浜プラン",
  "地域振興",
  "遊漁船業",
  "遊漁船業者登録",
  "遊漁船業務主任者",
  "遊漁船安全管理",
  "体験漁業",
  "観光漁業",
  "海洋レジャー",
  "漁業者兼業",
  "その他"
];

export const caseStatuses = ["未対応", "確認中", "回答済み", "継続支援", "保留", "完了"];

export const historyTypes = ["電話", "面談", "現地確認", "メール", "文書", "庁内協議", "県照会", "国照会", "漁協指導", "漁業者指導", "AI回答", "その他"];

export type ConsultationCase = {
  id: string;
  caseNumber: string;
  title: string;
  consultedAt: string;
  category: string;
  requester: string;
  requesterType: string;
  district: string;
  municipality: string;
  coopName: string;
  fishingPort: string;
  species: string;
  fisheryType: string;
  content: string;
  aiAnswer: string;
  sources: string[];
  assignee: string;
  status: string;
  nextActionDate: string;
  dueDate: string;
  stakeholders: string;
  internalMemo: string;
  tags: string[];
  updatedAt: string;
};

export const caseRecords: ConsultationCase[] = [
  {
    id: "case-yugyosen-001",
    caseNumber: "CASE-2026-0001",
    title: "漁業者の遊漁船業兼業相談",
    consultedAt: "2026-06-14",
    category: "遊漁船業",
    requester: "漁協職員",
    requesterType: "漁協職員",
    district: "北部",
    municipality: "名護市",
    coopName: "デモ漁協",
    fishingPort: "デモ漁港",
    species: "マグロ、カツオ",
    fisheryType: "一本釣り",
    content: "漁業者が休日に釣り客を案内したい。登録、主任者、保険、漁港からの出航を確認したい。",
    aiAnswer: "遊漁船業法上の登録、業務主任者、業務規程、損害賠償保険、漁港管理上の施設利用、漁協又は漁業権者との調整を分けて確認する必要があります。",
    sources: ["遊漁船業法", "漁港施設利用相談メモ"],
    assignee: "水産担当",
    status: "確認中",
    nextActionDate: "2026-06-20",
    dueDate: "2026-06-25",
    stakeholders: "漁協、漁港管理者、県担当課",
    internalMemo: "安全管理と保険の確認を優先。漁港係留は別途確認。",
    tags: ["遊漁船", "漁港出航", "漁業者兼業"],
    updatedAt: "2026-06-14"
  },
  {
    id: "case-port-002",
    caseNumber: "CASE-2026-0002",
    title: "漁港用地での試験養殖相談",
    consultedAt: "2026-06-10",
    category: "漁港利用",
    requester: "自治体職員",
    requesterType: "自治体職員",
    district: "中部",
    municipality: "うるま市",
    coopName: "デモ漁協",
    fishingPort: "試験漁港",
    species: "クルマエビ",
    fisheryType: "陸上養殖",
    content: "漁港用地で小規模な試験養殖を行いたい。",
    aiAnswer: "漁港区域、用地利用計画、目的外使用、排水、建築、補助金財産処分を確認してください。",
    sources: ["漁港用地及び施設利用相談 初期運用メモ"],
    assignee: "水産担当",
    status: "継続支援",
    nextActionDate: "2026-06-16",
    dueDate: "2026-06-13",
    stakeholders: "漁港管理者、環境担当",
    internalMemo: "期限超過。排水確認が未了。",
    tags: ["漁港利用", "養殖", "排水"],
    updatedAt: "2026-06-13"
  }
];

export const caseTemplates = {
  漁港利用: ["漁港名", "管理者", "利用場所", "施設又は用地の種類", "用地利用計画上の用途", "利用目的", "利用者", "利用期間", "営利目的の有無", "施設新設の有無", "排水の有無", "既存許可", "補助金取得財産の有無"],
  漁協指導: ["漁協名", "相談区分", "定款記載", "総会決議", "理事会決議", "組合員向け事業か", "員外利用の有無", "利用量", "売上額", "会計区分", "補助金", "内部統制上の懸念"],
  補助金: ["事業名", "申請者", "目的", "設備", "対象経費", "総事業費", "補助率", "消費税", "支払時期", "証憑", "按分", "他補助金", "財産処分", "実績報告期限"],
  養殖: ["魚種", "養殖方式", "海面又は陸上", "施設規模", "試験又は事業化", "取水", "排水", "薬品", "防疫", "漁港用地", "漁業権", "補助金", "融資", "販路"],
  遊漁船業: ["相談者", "相談者区分", "漁協名", "地区", "営業所所在地", "使用船舶", "船舶所有者", "船舶検査", "小型船舶操縦士免許", "特定操縦免許", "遊漁船業者登録の有無", "登録番号", "更新期限", "遊漁船業務主任者", "主任者講習修了日", "実務経験又は実務研修", "業務規程", "損害賠償保険", "主な案内内容", "対象魚種", "主な漁場", "出航漁港", "係留場所", "漁協又は漁業権者との調整", "料金徴収の有無", "体験漁業又は観光事業との関係", "事故歴", "相談内容", "次回確認事項"]
};

export type ChecklistRecord = {
  id: string;
  title: string;
  description: string;
  items: string[];
};

export const checklistRecords: ChecklistRecord[] = [
  {
    id: "port-use",
    title: "漁港利用チェックリスト",
    description: "漁港区域、施設、財産管理、許認可、補助金財産処分を確認します。",
    items: ["漁港区域内か", "漁港管理者", "漁港施設か", "公共白地か", "用地利用計画", "行政財産か普通財産か", "目的外使用", "占用", "行為許可", "建築確認", "排水処理", "民間貸付け", "公募又は公告", "使用料", "補助金財産処分", "国又は県協議"]
  },
  {
    id: "subsidy",
    title: "補助金チェックリスト",
    description: "交付要綱、対象経費、証憑、按分、実績報告、返還条件を確認します。",
    items: ["根拠要綱", "補助目的", "申請者適格", "対象経費", "対象期間", "支払完了", "見積書", "契約書", "請求書", "領収書", "振込記録", "写真", "消費税", "按分", "他補助金", "財産処分", "実績報告", "返還条件"]
  },
  {
    id: "coop-guidance",
    title: "漁協指導チェックリスト",
    description: "定款、総会、理事会、員外利用、会計区分、内部統制を確認します。",
    items: ["定款", "規約", "総会決議", "理事会決議", "組合員資格", "員外利用", "利用分量", "会計区分", "利益相反", "補助金", "証憑", "内部統制", "説明責任"]
  },
  {
    id: "yugyosen",
    title: "遊漁船業チェックリスト",
    description: "登録、安全管理、主任者、保険、漁場利用調整、漁港出航を確認します。",
    items: ["遊漁船業者登録が必要な事業か", "営業所所在地の都道府県手続を確認したか", "使用船舶を確認したか", "船舶所有者を確認したか", "船舶検査を確認したか", "小型船舶操縦士免許を確認したか", "特定操縦免許の要否を確認したか", "遊漁船業務主任者を選任しているか", "業務主任者の資格要件を確認したか", "業務主任者講習の有効期間を確認したか", "実務経験又は実務研修を確認したか", "出航時に業務主任者が乗船する体制か", "業務規程を作成しているか", "損害賠償保険に加入しているか", "利用者名簿を作成する運用か", "利用者への安全説明を行う運用か", "気象・海象に基づく出航判断基準があるか", "事故時の連絡体制があるか", "漁業権漁場との関係を確認したか", "漁協又は漁業権者との調整を確認したか", "漁港から出航する場合の施設利用を確認したか", "浜プラン又は海業との関係を整理したか"]
  }
];

export const documentTemplates = ["漁業者向け説明文", "漁協向け指導メモ", "庁内協議メモ", "法令整理表", "手続フロー", "チェックリスト", "不足資料一覧", "所管部署照会文案", "補助金審査メモ", "現地確認チェックシート", "面談記録", "FAQ案"];

export function isOverdue(dueDate: string) {
  return new Date(`${dueDate}T23:59:59+09:00`).getTime() < Date.now();
}

export function buildGeneratedDocument(template: string, record: ConsultationCase) {
  return `# ${template}

## 案件
- 案件番号: ${record.caseNumber}
- 件名: ${record.title}
- 相談区分: ${record.category}
- 地区: ${record.district}
- 漁協名: ${record.coopName}
- 担当者: ${record.assignee}

## 相談内容
${record.content}

## AI回答・整理
${record.aiAnswer}

## 根拠資料
${record.sources.map((source) => `- ${source}`).join("\n")}

## 次回対応
- 次回対応日: ${record.nextActionDate}
- 期限: ${record.dueDate}
- 関係者: ${record.stakeholders}

## 内部メモ
${record.internalMemo}
`;
}
