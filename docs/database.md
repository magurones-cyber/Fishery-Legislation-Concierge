# データベース設計

## 主要テーブル

- `organizations`: 自治体、漁協、団体などのテナント
- `users`, `roles`, `user_roles`: Supabase Auth と連携する利用者、権限
- `categories`: 階層化可能な情報源カテゴリ
- `documents`: 資料メタデータ
- `document_versions`: 資料バージョン
- `document_chunks`: RAG 用チャンク、条文番号、ページ番号、embedding
- `tags`, `document_tags`: タグ付け
- `qa_sessions`, `qa_messages`, `qa_sources`: 質問、回答、引用根拠
- `consultation_cases`, `consultation_history`, `consultation_attachments`: 相談案件
- `checklists`, `checklist_items`: 業務チェックリスト
- `case_checklists`, `case_checklist_items`: 案件へ紐付けたチェックリスト進捗
- `generated_documents`: AI回答又は案件情報から生成した実務向け文書
- `masking_settings`: AI送信前マスキングの組織別設定
- `backup_restore_events`: 論理削除・復元・バックアップ操作
- `answer_feedback`: AI回答評価と修正理由
- `ocr_jobs`: OCR要否判定、処理状況、結果確認、修正、再処理
- `case_photo_attachments`: 案件写真、サムネイル、EXIF、コメント、権限
- `faq_candidates`: 利用実績から作成するFAQ候補
- `external_connectors`: e-Gov、Drive、通知、CSV等の外部連携設定
- `offline_settings`: オフライン閲覧と機密資料保存の組織別設定
- `favorites`: お気に入り
- `audit_logs`: 操作監査
- `system_settings`, `prompt_templates`: 組織別設定、プロンプト
- `faq_items`: FAQ
- `update_notifications`: 法令・資料更新通知
- `question_examples`: 初期質問例
- `user_consents`: 利用規約、プライバシーポリシー、質問ログ分析同意
- `analytics_events`: 質問ログ分析、個別ログ閲覧、FAQ候補、研修テーマ、不足資料抽出等のイベント
- `terms_versions`: 規約・プライバシーポリシーの版管理

## 検索設計

`document_chunks` に以下を持たせます。

- `embedding vector(1536)`: Embeddings API の出力格納。初期設定は `text-embedding-3-small` と `EMBEDDING_DIMENSIONS=1536`
- `search_tsv`: キーワード検索用
- `article_number`: 条文番号検索用
- `page_start`, `page_end`: 引用ページ表示用
- `citation_text`: 回答 UI に表示する引用箇所

Phase 1 では `hybrid_search_document_chunks` RPC を追加し、ベクトル類似度、全文検索、資料名、条文番号、法令番号、所管をスコア化します。

Supabase pgvector の `ivfflat` index は 2000 次元を超える `vector` をインデックス化できません。そのため初期構築では `document_chunks.embedding` と検索RPC引数を `vector(1536)` に統一します。2000次元超のモデルへ変更する場合は、SQL型、Embedding生成次元、検索RPC、インデックス方式を同時に見直してください。

SQL Editorで手動構築する場合は `supabase/manual-setup/03_documents_rag_schema.sql` が資料・RAG関連テーブル、`match_documents(query_embedding vector(1536))`、`hybrid_search_document_chunks(query_embedding vector(1536))`、ivfflat indexを作成します。初期構築では `text-embedding-3-small` と1536次元を前提にします。

## 手動セットアップSQL

初心者向けのSQL Editor実行用として `supabase/manual-setup/` を用意しています。

- `00_enable_extensions.sql`: `vector`、`pg_trgm`、`pgcrypto`
- `01_core_schema.sql`: enum、組織、ユーザー、カテゴリ、タグ、FAQ、チェックリスト
- `02_auth_org_roles.sql`: デフォルト組織とロール
- `03_documents_rag_schema.sql`: 資料、版、チャンク、RAG検索関数
- `04_qa_logs_analytics_schema.sql`: 質問ログ、案件、監査、同意、分析
- `05_policies.sql`: RLS、権限関数、policy
- `06_seed_master_data.sql`: カテゴリ、遊漁船タグ、チェックリスト、質問例
- `07_storage_notes.sql`: private bucket前提のStorage設定
- `all_in_one_setup.sql`: 空Project向け統合版
- `99_reset_dev_only.sql`: 開発・空Project専用リセット

Phase 1 後のカテゴリ再設計で、`03_漁港・漁場・漁港施設等活用`、`10_地域振興・浜プラン・海業`、`12_遊漁船・海洋レジャー・安全管理` の使い分けを追加しました。カテゴリ12には遊漁船業法、登録、更新、変更届、業務主任者、業務規程、安全管理、保険、事故報告、利用者名簿、漁場利用調整等のサブカテゴリを持たせます。

## RLS 方針

基本は `organization_id = current_user_org_id()` で分離します。管理者は同一組織の管理、`super_admin` は横断管理を想定します。サービスロールを使うバッチ処理は、サーバー側に限定します。

Phase 2では、一般利用者、漁協職員、自治体職員、管理者、システム管理者をロールとして扱います。相談案件、内部メモ、添付資料、生成文書は個人情報を含む可能性があるため、`organization_id`、案件への所属、ロールを前提にRLSで制御します。

Phase 3では、資料の `visibility` と案件の `visibility`、`related_user_ids`、`assigned_to` を使ってDB側でも権限制御します。公開資料は全利用者、漁協内部資料は漁協職員以上、自治体内部資料は自治体職員以上、管理資料は管理者以上、非公開案件は案件担当者・関係者・管理者に限定します。

## Storage 方針

Supabase Storage には、後続 Phase で以下の bucket を作成します。

- `documents`: 法令、通知、FAQ、内部資料などの原本
- `consultation-attachments`: 相談案件の添付資料
- `generated`: OCR 結果、抽出テキスト、処理済みファイル

bucket policy は `organization_id` と DB レコードを介して制御し、個人情報を含む添付を公開 bucket に置かない方針です。

## Phase 1 追加列

`documents` には、登録項目として `subcategory_id`、`document_number`、`last_amended_at`、`acquired_at`、`source_url`、`visibility`、`update_cycle`、`notes`、`file_format`、`processing_status`、`processing_error`、`processed_at` を追加します。

## 質問ログ分析

`qa_sessions` には `visibility`、`consent_version`、`contains_personal_data`、`anonymized_for_analytics`、`category_id`、`confidence_level`、`missing_sources`、`feedback` を追加します。`qa_messages` には `raw_text`、`masked_text`、`ai_sent_text`、`contains_personal_data` を追加し、通常分析では `masked_text` を使います。

## Phase 2 案件管理

`consultation_cases` には、案件番号、相談日、相談区分、相談者、地区、市町村、漁協名、漁港名、魚種、漁業種類、相談内容、AI回答、根拠資料、担当者、対応状況、次回対応日、期限、関係者、内部メモ、添付資料要約、タグを追加します。

`consultation_history` には、対応日時、対応者、対応種別、内容、次回対応、公開範囲、添付資料要約を持たせます。対応種別は電話、面談、現地確認、メール、文書、庁内協議、県照会、国照会、漁協指導、漁業者指導、AI回答、その他を想定します。

`case_checklists` と `case_checklist_items` は、標準チェックリストを案件へコピーして進捗保存するためのテーブルです。標準項目変更後も、案件当時の確認項目を保持できるよう `label` を保存します。

`generated_documents` は、漁業者向け説明文、漁協向け指導メモ、庁内協議メモ、法令整理表、手続フロー、チェックリスト、不足資料一覧、所管部署照会文案、補助金審査メモ、現地確認チェックシート、面談記録、FAQ案を保存します。本文はMarkdownで保存し、PDFは印刷、Wordは次Phaseで変換処理を追加します。

## Phase 3 管理・更新・監査

`documents` には、更新周期、最終確認日、次回確認日、更新担当者、改正有無、影響するFAQ、影響する回答テンプレート、影響する案件、影響範囲、状態、論理削除情報を追加します。

`document_versions` には、旧版ID、旧版テキスト、新版テキスト、差分JSON、状態、施行日、最終改正日、取得日、取得元URL、更新理由、公開範囲を追加します。旧版を上書きせず、新しい版として保存します。

`audit_logs` は、期間、ユーザー、操作種別、資料、案件、IPアドレス、結果で検索できるようにします。AIへ送信した内容は平文保存せず、マスキング済み要約又はハッシュを保存します。

`masking_settings` は、氏名、電話番号、メールアドレス、住所、口座情報、個別事業者名、非公開案件名、船名、登録番号の検知・置換設定を組織別に管理します。

`backup_restore_events` は、削除済み資料・案件の復元、バックアップ取得、復元テストの実施結果を記録します。

## Phase 4 高度化

`ocr_jobs` は、OCR未処理、処理開始、処理中、結果確認、完了、失敗を管理します。OCR結果は確認・修正後に再チャンク化し、Embeddingを再生成します。

`case_photo_attachments` は、現地写真、施設写真、領収書、請求書、漁船、機器、排水状況、市場衛生状況を案件へ紐付けます。EXIFは保存前に確認し、位置情報や個人情報を外部APIへ送らない方針です。

`faq_candidates` は、質問頻度、類似質問、回答評価、根拠資料、カテゴリ、未解決事項を保存します。自動公開は禁止し、管理者確認後に `faq_items` へ反映します。

`organizations` にはロゴ、表示名、対象区域、テナント設定を追加します。既存データは現在の `organization_id` を維持し、新規自治体は新しい組織IDで分離します。

`external_connectors` は外部連携の設定と同期状態を保存します。APIキーやOAuth秘密情報はDB平文ではなく、Vercel/Supabaseのシークレット管理を使います。
