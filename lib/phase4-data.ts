export const ocrJobs = [
  {
    id: "ocr-001",
    documentTitle: "遊漁船業登録申請書スキャン",
    status: "OCR未処理",
    needsOcr: true,
    provider: "manual-or-external",
    pages: 12,
    updatedAt: "2026-06-14"
  },
  {
    id: "ocr-002",
    documentTitle: "補助金実績報告書PDF",
    status: "OCR結果確認",
    needsOcr: true,
    provider: "external",
    pages: 8,
    updatedAt: "2026-06-14"
  }
];

export const photoAttachmentTypes = ["現地写真", "施設写真", "領収書", "請求書", "漁船", "機器", "排水状況", "市場衛生状況"];

export const samplePhotos = [
  { id: "photo-1", type: "現地写真", comment: "漁港用地の利用予定箇所", capturedAt: "2026-06-14 09:20", exifPolicy: "位置情報は保存前に確認" },
  { id: "photo-2", type: "排水状況", comment: "排水経路の確認", capturedAt: "2026-06-14 09:35", exifPolicy: "個人情報が写り込む場合は削除又はマスキング" }
];

export const faqCandidates = [
  {
    id: "faq-001",
    question: "漁港から遊漁船を出航させる場合、漁港管理上の確認事項は何ですか。",
    frequency: 18,
    similarQuestions: 6,
    ratingSummary: "根拠不足 2件、役に立った 12件",
    category: "遊漁船・海洋レジャー・安全管理",
    sources: ["遊漁船業安全管理チェックメモ", "漁港用地及び施設利用相談 初期運用メモ"],
    unresolved: "漁港ごとの施設利用許可基準",
    status: "管理者確認待ち"
  },
  {
    id: "faq-002",
    question: "補助対象経費に消費税を含めてよいですか。",
    frequency: 14,
    similarQuestions: 4,
    ratingSummary: "情報が古い 1件、追加資料が必要 3件",
    category: "自治体財務・補助金",
    sources: ["補助対象経費・消費税確認メモ"],
    unresolved: "年度別交付要綱の差分確認",
    status: "下書き"
  }
];

export const answerRatingOptions = ["役に立った", "一部修正が必要", "役に立たなかった", "根拠不足", "引用誤り", "情報が古い", "追加資料が必要"];

export const usageMetrics = [
  { label: "質問数", value: "128", trend: "+18%" },
  { label: "利用者数", value: "34", trend: "+6" },
  { label: "未解決質問", value: "9", trend: "-2" },
  { label: "資料閲覧数", value: "412", trend: "+21%" },
  { label: "検索数", value: "276", trend: "+14%" },
  { label: "相談案件数", value: "23", trend: "+5" },
  { label: "期限超過案件", value: "2", trend: "要対応" },
  { label: "更新期限切れ資料", value: "1", trend: "要対応" }
];

export const categoryUsage = [
  { label: "遊漁船", count: 42 },
  { label: "漁港利用", count: 31 },
  { label: "補助金", count: 24 },
  { label: "漁協指導", count: 18 }
];

export const tenantSettings = [
  ["自治体名", "デモ自治体"],
  ["ロゴ", "未設定"],
  ["表示名", "漁業関係法令コンシェルジュ"],
  ["対象区域", "県内全域"],
  ["公開資料", "共有カテゴリと自治体公開資料"],
  ["内部資料", "organization_idで分離"],
  ["利用者", "Supabase Auth + user_roles"],
  ["管理者", "admin/system_admin"],
  ["カテゴリ", "組織別カテゴリ上書き可能"],
  ["テンプレート", "組織別prompt_templates"],
  ["チェックリスト", "組織別checklists"]
];

export const externalIntegrations = [
  { name: "e-Gov法令API", status: "設計", requirement: "API仕様確認、法令ID対応、差分取得バッチ" },
  { name: "条例データベース", status: "設計", requirement: "自治体ごとの公開形式確認、スクレイピング規約確認" },
  { name: "自治体公式Webサイト", status: "設計", requirement: "robots.txt、更新RSS、ページ差分監視" },
  { name: "Google Drive", status: "追加設定", requirement: "OAuth同意画面、Drive API、フォルダ権限" },
  { name: "OneDrive", status: "追加設定", requirement: "Microsoft Entra ID、Graph API、サイト権限" },
  { name: "メール通知", status: "追加設定", requirement: "SMTP又はSendGrid等、送信ログ、宛先管理" },
  { name: "カレンダー通知", status: "追加設定", requirement: "Google/MicrosoftカレンダーAPI、期限同期" },
  { name: "CSVインポート", status: "実装候補", requirement: "カテゴリ、タグ、FAQ、利用者の検証付き取込" },
  { name: "CSVエクスポート", status: "実装候補", requirement: "監査ログ、案件、FAQ候補、利用統計の権限制御付き出力" }
];

export const offlinePolicy = {
  enabledByDefault: true,
  confidentialOfflineDefault: false,
  cacheTargets: ["アプリ基本画面", "最近閲覧した資料", "お気に入り資料", "保存済みチェックリスト", "未送信メモ"],
  warning: "機密資料のオフライン保存は組織設定で無効化できます。共有端末では保存しないでください。"
};
