# バックアップ・復元手順

## バックアップ

1. Supabaseの定期バックアップを有効化する。
2. 重要更新前にDBバックアップとStorageエクスポートを取得する。
3. バックアップは `BACKUP_BUCKET` 又は管理者指定の外部Object Storageへ保存する。
4. 個人情報を含むバックアップは暗号化し、管理者以上に限定する。
5. GitHubへDBダンプ、Storageエクスポート、PDF、写真、Embeddingを置かない。
6. 復元テストを実施し、`backup_restore_events` に記録する。

## 復元

1. 監査ログで削除操作、対象ID、実行者、理由を確認する。
2. 論理削除済み資料又は案件を復元対象にする。
3. `deleted_at` を解除し、`restored_at`、`restored_by` を記録する。
4. 資料は `document_versions`、案件は履歴、添付、チェックリストを確認する。
5. 復元後、RLS、公開範囲、検索チャンク、Embeddingを確認する。

## アーカイブ

旧版資料、保管期限を過ぎた質問ログ、完了案件添付、集計済み詳細ログは `ARCHIVE_BUCKET` へ移動し、`archive_records` に保存先、元テーブル、元ID、復元状態を記録します。実ファイル転送は `storage_transfer_jobs` で進捗とエラーを管理します。

復元時はアーカイブbucketから元bucketへ戻し、DBメタデータを更新します。復元理由、実行者、対象ID、結果は監査ログへ記録します。
