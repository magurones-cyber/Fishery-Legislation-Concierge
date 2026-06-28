import { FileText, Home, Menu, Search, UserRound } from "lucide-react";

export const menuLinks = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/ask", label: "質問", icon: Menu },
  { href: "/search", label: "検索", icon: Search },
  { href: "/cases", label: "案件", icon: FileText },
  { href: "/admin", label: "メニュー", icon: UserRound }
];

export const adminLinks = [
  { href: "/admin/documents", label: "資料管理", description: "法令・通知・手引・内部資料を登録、編集、削除します。" },
  { href: "/admin/categories", label: "カテゴリ管理", description: "資料と質問を分類する業務カテゴリを確認します。" },
  { href: "/admin/tags", label: "タグ管理", description: "検索、案件、FAQ候補で使う補助分類を確認します。" },
  { href: "/admin/users", label: "ユーザー管理", description: "招待制アカウント、所属、表示名を管理します。" },
  { href: "/admin/roles", label: "ロール管理", description: "一般、漁協職員、自治体職員、管理者の権限を確認します。" },
  { href: "/admin/tenants", label: "自治体別設定", description: "自治体名、対象区域、組織ID、ロゴ、データ分離方針を確認します。" },
  { href: "/admin/logs", label: "監査ログ", description: "質問、資料、案件、ユーザー操作の記録を確認します。" },
  { href: "/admin/notifications", label: "更新通知", description: "法令改正や重要資料更新のお知らせを確認します。" },
  { href: "/admin/prompts", label: "プロンプト管理", description: "AI回答で使う業務ルールと回答形式を確認します。" },
  { href: "/admin/analytics", label: "質問ログ分析", description: "質問傾向、不足資料、回答評価を匿名集計で確認します。" },
  { href: "/admin/storage", label: "Storage管理", description: "PDF、添付、バックアップの保存先と権限を確認します。" },
  { href: "/admin/backups", label: "バックアップ", description: "DBとStorageのバックアップ方針を確認します。" },
  { href: "/admin/archives", label: "アーカイブ", description: "削除済み・旧版資料の保管方針を確認します。" },
  { href: "/admin/settings", label: "設定", description: "モデル、既定組織、マスキング、復元方針を確認します。" }
];
