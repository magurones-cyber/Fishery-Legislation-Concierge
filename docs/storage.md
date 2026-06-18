# ストレージ・外部保存設計

## 基本方針

GitHub無料プランを圧迫しないため、GitHubには再現に必要なコードと設計情報だけを保存します。法令PDF、Word/Excel、写真、音声、動画、質問ログ、AI回答履歴、Embedding、DBダンプ、バックアップ、個人情報、実案件データはGit管理しません。

## GitHubに保存するもの

- アプリケーションコード
- README、AGENTS、設計文書
- `.env.example`
- `package.json`、lockfile
- SQLマイグレーション
- 最小限の `supabase/seed.sql`
- 型定義、テスト、UIコンポーネント
- 小さなサンプルテキスト

## GitHubに保存しないもの

- 法令PDF、条例PDF、通知、手引の実ファイル
- 写真、動画、音声、証憑、領収書、請求書
- 実質問ログ、AI回答履歴、相談案件、個人情報
- Embedding、ベクトルストア、検索キャッシュ
- 本番DBダンプ、バックアップ、CSVエクスポート
- `.env`、APIキー、サービスロールキー

## 保存先

| データ | 保存先 | 理由 |
| --- | --- | --- |
| 法令PDF・通知・手引 | Supabase Storage `documents` 又は外部Object Storage | 大容量、公開範囲制御、署名付きURL |
| 案件写真・証憑 | Supabase Storage `attachments` 又は外部Object Storage | 案件権限と連動 |
| メタデータ | Supabase PostgreSQL | RLS、検索、監査 |
| Embedding | Supabase PostgreSQL `pgvector` | 権限制御済み検索 |
| 監査ログ | Supabase PostgreSQL | 改ざん検知と検索 |
| 長期保管 | `archives` bucket | 復元性と保管期限管理 |
| バックアップ | `backups` bucket 又は管理者指定保存先 | GitHubから分離 |

## StorageAdapter

資料登録は `lib/storage` の `StorageAdapter` を経由します。初期実装はSupabase Storageです。

```ts
const storage = createStorageAdapter({ supabase });
await storage.upload({ bucket: getDocumentBucket(), path, file, contentType });
```

外部Object Storageを使う場合は `STORAGE_PROVIDER` を `s3`、`r2`、`b2` などに変更し、`ExternalStorageAdapter` に認証、アップロード、署名付きURL、削除処理を実装します。APIキーはサーバー側環境変数のみで扱い、ブラウザへ渡しません。

## 環境変数

- `STORAGE_PROVIDER`: 通常保存先。初期値 `supabase`
- `ARCHIVE_STORAGE_PROVIDER`: アーカイブ保存先。初期値 `supabase`
- `DOCUMENT_BUCKET`: 資料bucket。初期値 `documents`
- `ATTACHMENT_BUCKET`: 添付bucket。初期値 `attachments`
- `ARCHIVE_BUCKET`: アーカイブbucket。初期値 `archives`
- `BACKUP_BUCKET`: バックアップbucket。初期値 `backups`

## アーカイブ

以下はDBメタデータを残し、実体ファイルをアーカイブbucketへ移動できます。

- 旧版資料
- 保管期限を過ぎた質問ログ、AI回答履歴
- 完了後一定期間を経過した案件添付
- 集計済み詳細ログ
- 復元用世代バックアップ

移動処理は `storage_transfer_jobs` に記録し、復元対象は `archive_records` で管理します。復元操作は管理者以上に限定し、監査ログへ記録します。

## 容量チェック

`npm run check:repo-size` は以下を確認します。

- リポジトリ容量10MB以上で警告、50MB以上でエラー
- `.env` の混入をエラー
- `data/`、`uploads/`、`backups/`、`embeddings/` 等の実データ用ディレクトリ混入をエラー
- PDF、Word、Excel、動画、音声等の大容量候補を警告

`npm run build` の前にも自動実行されます。
