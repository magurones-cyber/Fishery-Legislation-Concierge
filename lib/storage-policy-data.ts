export const storageDestinations = [
  { name: "法令PDF・画像・添付", destination: "Supabase Storage / 外部Object Storage", reason: "GitHub容量と個人情報保護のためGit管理しない" },
  { name: "メタデータ・Embedding・監査ログ", destination: "Supabase PostgreSQL", reason: "RLS、検索、監査の対象にする" },
  { name: "バックアップ・長期保管", destination: "Archive bucket / 管理者指定保存先", reason: "復元性と世代管理をGitから分離する" },
  { name: "コード・SQL・最小seed", destination: "GitHub", reason: "再現可能な構成情報のみを管理する" }
];

export const bucketPolicies = [
  { bucket: "documents", scope: "法令・通知・手引PDF", access: "資料の公開範囲とRLSに連動。署名付きURLを短時間発行する。" },
  { bucket: "attachments", scope: "案件写真・証憑・面談資料", access: "案件担当者、関係者、管理者に限定する。" },
  { bucket: "archives", scope: "旧版資料、古いログ、完了案件添付", access: "管理者以上。復元時は監査ログへ記録する。" },
  { bucket: "backups", scope: "DB/Storageバックアップ", access: "システム管理者のみ。暗号化と保存期限を必須にする。" }
];

export const archiveCandidates = [
  "旧版のdocument_versions原本",
  "保管期限を過ぎた質問・AI回答履歴",
  "完了後一定期間を経過した案件添付",
  "検索集計後の詳細ログ",
  "復元用の世代バックアップ"
];

export const transferStatuses = [
  { label: "待機中", description: "対象抽出のみ完了。実ファイル転送前。" },
  { label: "転送中", description: "Storage間コピー又は外部保存先へ転送中。" },
  { label: "完了", description: "DBメタデータ更新と監査ログ記録まで完了。" },
  { label: "要確認", description: "転送失敗、署名URL発行失敗、権限不一致を確認する。" }
];
