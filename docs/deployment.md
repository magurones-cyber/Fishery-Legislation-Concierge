# デプロイ手順

## 環境変数

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSIONS`
- `OPENAI_EMBEDDING_MODEL`
- `OCR_PROVIDER`
- `NEXT_PUBLIC_DEFAULT_TENANT_ID`
- `STORAGE_PROVIDER`
- `ARCHIVE_STORAGE_PROVIDER`
- `DOCUMENT_BUCKET`
- `ATTACHMENT_BUCKET`
- `ARCHIVE_BUCKET`
- `BACKUP_BUCKET`

## Vercel

1. GitリポジトリをVercelへ接続する。
2. 環境変数をPreview/Productionへ設定する。
3. `NEXT_PUBLIC_APP_URL` をVercelの本番URLに設定する。
4. `npm run check:repo-size` が通ることを確認し、PDF、バックアップ、DBダンプ、実案件データがGitに含まれていないことを確認する。
5. `npm run build` が通ることを確認する。
6. PWA、ダークモード、スマートフォン表示、アクセシビリティを確認する。

## Supabase

Supabaseの管理アカウント及びProjectは、アプリから自動作成しません。運営者が以下を行います。

1. Supabaseで運営者アカウントを作成する。
2. Supabase Dashboardで新しいProjectを作成する。
3. Project Settings > APIでProject URL、publishable key、secret keyを取得する。
4. Vercel又は `.env.local` に `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY` を設定する。
5. Authentication > ProvidersでEmailを有効化する。
6. Authentication > URL ConfigurationでSite URLを本番URLに設定し、Redirect URLsへ `http://localhost:3000/**` と `https://<Vercelドメイン>/**` を追加する。
7. 自由サインアップを無効化し、管理者招待制で運用する。
8. 初心者向けの手動構築では `supabase/manual-setup/` を番号順に適用する。デフォルト組織投入後にカテゴリ、タグ、FAQ、プロンプト、チェックリストを投入する。
9. RLSが有効なことを確認する。
10. Storage bucket `documents`、`attachments`、`archives`、`backups` を作成し、privateにする。
11. 非公開資料と案件添付は公開bucketに置かない。
12. PDFと添付画像は署名付きURLで表示する。
13. 署名付きURLの有効期限、bucket policy、RLSとアプリ側ロール判定を確認する。

## Supabase SQL Editorでのマイグレーション実行順

初心者向けには、既存migrationではなく `supabase/manual-setup/` を使います。Supabase SQL Editorで以下を順番に実行してください。

1. Supabase Projectを開く。
2. 左メニューの SQL Editor を開く。
3. New query を押す。
4. `supabase/manual-setup/00_enable_extensions.sql` の中身を貼る。
5. Run を押し、Success表示を確認する。
6. 次のSQLへ進む。

手動セットアップの実行順:

1. `supabase/manual-setup/00_enable_extensions.sql`
2. `supabase/manual-setup/01_core_schema.sql`
3. `supabase/manual-setup/02_auth_org_roles.sql`
4. `supabase/manual-setup/03_documents_rag_schema.sql`
5. `supabase/manual-setup/04_qa_logs_analytics_schema.sql`
6. `supabase/manual-setup/05_policies.sql`
7. `supabase/manual-setup/06_seed_master_data.sql`
8. `supabase/manual-setup/07_storage_notes.sql`
9. `supabase/manual-setup/08_auth_connection.sql`

1本で実行したい場合は、空のSupabase Projectで `supabase/manual-setup/all_in_one_setup.sql` を実行します。途中まで手動実行したProjectでは、分割SQLを番号順に実行する方が原因を切り分けやすいです。

既存Projectで、削除済み資料が検索結果に残る場合は、追加で `supabase/migrations/202606280001_deleted_documents_search_filter.sql` をSQL Editorで実行してください。`match_documents` と `hybrid_search_document_chunks` が `documents.deleted_at is null` を必ず確認するようになります。アプリ側の「誤登録を削除」は、DBの論理削除、検索チャンク削除、Storage原本削除を連動して実行します。

`99_reset_dev_only.sql` は開発・空Projectのやり直し専用です。本番又は実データ入りDBでは実行しないでください。

既存migrationを使う場合は、`supabase/migrations/` のSQLをファイル名の昇順で実行します。少なくとも以下の順序を守ってください。

1. `202606130001_initial_schema.sql`
2. `202606130002_default_organization.sql`
3. `202606140001_phase1_rag.sql`
4. `202606140002_recreational_fishing_boat_categories.sql`
5. `202606140003_log_analysis_consent_phase2.sql`
6. `202606140004_phase2_checklists_templates.sql`
7. `202606140005_recreational_boat_integrated_additions.sql`
8. `202606140006_phase2_case_management.sql`
9. `202606140007_phase3_admin_audit_security.sql`
10. `202606140008_phase4_operations_integrations.sql`
11. `202606140009_phase5_release_hardening.sql`
12. `202606140010_storage_archive_policy.sql`
13. `202606140011_question_log_access_control.sql`
14. `202606140012_security_privacy_hardening.sql`
15. `202606140013_auth_invitation_policy.sql`
16. `202606150001_embedding_1536_pgvector.sql`
17. `202606200001_supabase_auth_connection.sql`
18. `202606280001_deleted_documents_search_filter.sql`

`202606130002_default_organization.sql` は、次のデフォルト組織をupsertします。カテゴリ、タグ、FAQ、プロンプトテンプレート、チェックリストなど `organization_id` を持つseedは、この行が存在する状態で実行してください。

```sql
insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;
```

SQL Editorでカテゴリ・タグ関連SQLだけを再実行する場合も、先に `202606130002_default_organization.sql` を実行してから対象SQLを実行します。

`202606150001_embedding_1536_pgvector.sql` は、古い `vector(3072)` 関数やindexが残った環境でも1536次元へ補正するための再実行可能なSQLです。既に資料を登録している環境で実行すると `document_chunks.embedding` を作り直すため、Embeddingの再生成が必要です。

Supabase pgvector の `ivfflat` index は 2000 次元を超える `vector` をインデックス化できません。初期設定では以下を必ず揃えます。

- `document_chunks.embedding`: `vector(1536)`
- `hybrid_search_document_chunks.query_embedding`: `vector(1536)`
- `match_documents.query_embedding`: `vector(1536)`
- `EMBEDDING_MODEL`: `text-embedding-3-small`
- `EMBEDDING_DIMENSIONS`: `1536`

## 途中まで作成されたテーブルのリセットSQL

SQL Editorで途中まで実行して失敗した初期構築環境は、必要に応じて以下を先に実行してから、上記の順番でマイグレーションを再実行します。本番データや登録済み資料がある環境では実行しないでください。

```sql
-- 初期構築の失敗復旧専用。資料、チャンク、質問、案件などの業務データを削除します。
drop function if exists public.match_documents(vector(3072), integer, uuid, text[]);
drop function if exists public.match_documents(vector(1536), integer, uuid, text[]);

drop function if exists public.hybrid_search_document_chunks(text, vector(3072), uuid, text[], uuid, text, text, text, integer);
drop function if exists public.hybrid_search_document_chunks(text, vector(1536), uuid, text[], uuid, text, text, text, integer);
drop function if exists public.hybrid_search_document_chunks(text, vector(3072), uuid, text[], uuid, text[], text, text, text, integer);
drop function if exists public.hybrid_search_document_chunks(text, vector(1536), uuid, text[], uuid, text[], text, text, text, integer);

drop index if exists public.document_chunks_embedding_idx;

truncate table
  public.qa_sources,
  public.qa_messages,
  public.qa_sessions,
  public.document_tags,
  public.document_chunks,
  public.document_versions,
  public.documents
restart identity cascade;

alter table if exists public.document_chunks drop column if exists embedding;
alter table if exists public.document_chunks add column if not exists embedding vector(1536);

create index if not exists document_chunks_embedding_idx
on public.document_chunks
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
```

テーブル定義自体を最初から作り直したい場合は、Supabase Projectを新規作成し直す方法が最も安全です。既存Projectで全テーブルをdropする運用は、Auth、Storage、RLS、監査ログも影響するため推奨しません。

## SQL Editorでよくあるエラー

### policy already exists

`manual-setup/05_policies.sql` は、すべての `create policy` の直前に `drop policy if exists` を置いています。既存migrationを途中まで実行して発生した場合は、`05_policies.sql` を実行してpolicyを作り直してください。

### organization_id foreign key error

カテゴリ、タグ、FAQ、プロンプト、チェックリストは `00000000-0000-0000-0000-000000000000` のデフォルト組織を参照します。`02_auth_org_roles.sql` を先に実行してから `06_seed_master_data.sql` を実行してください。

### vector dimension error

Supabase pgvectorの `ivfflat` index は2000次元を超える `vector` ではエラーになります。初期設定では `EMBEDDING_MODEL=text-embedding-3-small`、`EMBEDDING_DIMENSIONS=1536`、SQLは `embedding vector(1536)` / `query_embedding vector(1536)` に統一しています。

### 途中まで実行して分からなくなった場合

実データがない初期構築中なら、Supabase Projectを作り直すのが最も安全です。開発用に同じProjectでやり直す場合だけ、`supabase/manual-setup/99_reset_dev_only.sql` を確認してから実行してください。

## Auth運用

1. Supabase Dashboardの Authentication > Users で初期管理者を作成し、User UIDを控える。
2. SQL Editorで `supabase/manual-setup/08_auth_connection.sql` を実行する。
3. UIDを置き換えて次を実行する。

```sql
select public.bootstrap_auth_user(
  'Authenticationで確認したUser UID',
  '00000000-0000-0000-0000-000000000000',
  'system_admin',
  '初期管理者'
);
```

4. `/login` からログインする。未ログイン時は自動的に `/login` へ移動する。
5. 初回ログイン時は `/consent` へ移動し、利用規約、プライバシーポリシー、質問ログ分析に同意する。
6. 同意後、管理者が `/admin/users` から一般利用者を招待する。
7. 招待利用者はメール内リンクでCookieセッションを作成し、パスワードを設定する。以後はパスワード又はマジックリンクでログインできる。
8. `/admin` と管理APIはCookieセッション、所属、DBロール、同意履歴をサーバー側で確認する。管理用固定トークンは使用しない。

### 認証メールのテンプレート

Authentication > Emailsで、別端末やメール内ブラウザからも認証できるトークンハッシュ方式へ変更します。

- Magic Link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/consent`
- Invite user: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth/set-password`

リンク先の `/auth/confirm` は `verifyOtp` をサーバー側で実行し、成功時だけCookieセッションを発行します。Site URLとRedirect URLはAuthentication > URL Configurationで本番ドメインに限定し、認証メールのURLを運用ログへ保存しないでください。

初期管理者の紐付け後は `bootstrap_auth_user` を通常運用で使いません。関数は `anon` と `authenticated` から実行できず、SQL Editorの運営者だけが実行できます。

`SUPABASE_SECRET_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`OPENAI_API_KEY` はサーバー側のみで使用します。`NEXT_PUBLIC_` を付けず、ブラウザへ露出させません。`.env.local` はGitHubへコミットしません。

## 外部Object Storage

S3、Cloudflare R2、Backblaze B2等を使う場合は、`STORAGE_PROVIDER` と `ARCHIVE_STORAGE_PROVIDER` を切り替え、`lib/storage/external-storage.ts` に実装を追加します。認証情報はVercelのProduction/Preview環境変数に保存し、ブラウザへ公開しません。

外部Storage有効化前に、保存先リージョン、暗号化、署名付きURL、監査ログ、削除・復元手順、費用見積を確認してください。
