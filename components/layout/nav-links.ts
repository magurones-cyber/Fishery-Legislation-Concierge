import { FileText, Home, Menu, Search, UserRound } from "lucide-react";

export const menuLinks = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/ask", label: "質問", icon: Menu },
  { href: "/search", label: "検索", icon: Search },
  { href: "/cases", label: "案件", icon: FileText },
  { href: "/admin", label: "メニュー", icon: UserRound }
];

export const adminLinks = [
  { href: "/admin/documents", label: "資料管理" },
  { href: "/admin/categories", label: "カテゴリ管理" },
  { href: "/admin/tags", label: "タグ管理" },
  { href: "/admin/users", label: "ユーザー管理" },
  { href: "/admin/roles", label: "ロール管理" },
  { href: "/admin/tenants", label: "自治体別設定" },
  { href: "/admin/logs", label: "監査ログ" },
  { href: "/admin/notifications", label: "更新通知" },
  { href: "/admin/prompts", label: "プロンプト管理" },
  { href: "/admin/analytics", label: "質問ログ分析" },
  { href: "/admin/storage", label: "Storage管理" },
  { href: "/admin/backups", label: "バックアップ" },
  { href: "/admin/archives", label: "アーカイブ" },
  { href: "/admin/settings", label: "設定" }
];
