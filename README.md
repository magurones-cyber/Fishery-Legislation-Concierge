# 漁業関係法令コンシェルジュ

水産行政、水産業協同組合、漁業者支援に特化したスマートフォン対応 PWA です。Phase 4 では、本番運用を見据え、OCRフロー、音声入力、写真添付、FAQ改善、回答評価、利用状況分析、自治体別設定、外部連携設計、オフライン閲覧、運用手順を追加しています。

## 実装範囲

- Next.js App Router / TypeScript / Tailwind CSS
- shadcn/ui 方針の軽量 UI コンポーネント
- スマートフォン優先のダッシュボード、質問、検索、資料、カテゴリ、案件、管理画面
- 下部固定ナビゲーション
- PWA manifest / service worker / アイコン
- Supabase 接続設定
- PostgreSQL、RLS、pgvector を含む初期 SQL マイグレーション
- 情報源カテゴリの seed
- 仮データ表示、空状態、未接続状態の注意表示
- グローバル loading / error / not-found
- `/api/health` のヘルスチェック
- PDF / TXT / Markdown / XML / RTF の資料登録 API
- PDF / TXT / Markdown / XML / RTF テキスト抽出、OCR 未処理判定、条文・見出し単位のチャンク化
- OpenAI Embeddings API による `document_chunks.embedding` 保存
- ベクトル検索、全文検索、法令名検索、条文番号検索、カテゴリ、タグ、資料種別、所管のハイブリッド検索
- OpenAI Responses API による根拠付き回答
- 引用カード表示、根拠不足時の警告、質問ログ保存
- カテゴリ03/10の海業論点整理と、12_遊漁船・海洋レジャー・安全管理の追加
- 質問ログ分析、利用規約、プライバシーポリシー、同意画面、マスキング基盤
- `/cases`、`/cases/new`、`/cases/[id]`、`/cases/[id]/edit` の案件管理画面
- 相談区分、対応状況、期限、次回対応、関係者、内部メモ、添付資料を扱う案件設計
- 案件ごとの対応履歴、AI回答、根拠資料、チェックリスト紐付け表示
- `/checklists`、`/checklists/[id]` の業務チェックリストと進捗保存設計
- AI回答・案件情報からの漁業者向け説明文、漁協向け指導メモ、庁内協議メモ等の文書生成UI
- 生成文書の画面編集、コピー、Markdown出力、印刷/PDF出力
- 一般利用者、漁協職員、自治体職員、管理者、システム管理者のロール設計
- `/admin/documents/new`、`/admin/documents/[id]`、`/admin/documents/[id]/versions`
- `/admin/tags`、`/admin/roles`、`/admin/logs`、`/admin/notifications`、`/admin/prompts`
- 資料の旧版保存、新版保存、差分表示、更新期限警告
- 更新通知、監査ログ検索、マスキング設定、論理削除・復元設計
- AI送信前のマスキング確認画面、回答安全確認、回答評価
- OCR要否判定、OCRジョブ、結果確認、修正、再チャンク化、Embedding再生成の設計
- スマートフォン向け音声入力
- 案件への写真添付UI、撮影、アップロード、サムネイル、EXIF取扱い方針
- FAQ候補管理、管理者確認後の公開フロー
- 利用状況分析ダッシュボード
- 自治体別テナント設定
- 外部連携手順書、オフライン閲覧キャッシュ拡張
- GitHub無料プランを圧迫しないためのStorageAdapter、外部保存・アーカイブ設計、リポジトリ容量チェック
- `/admin/storage`、`/admin/backups`、`/admin/archives` の運用確認画面

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000/dashboard` を開きます。

Supabase SQLが未適用でも画面確認できるよう、初期設定ではデモモードを維持します。

```env
NEXT_PUBLIC_APP_MODE=demo
NEXT_PUBLIC_USE_MOCK_DATA=true
```

## 品質確認

```bash
npm run lint
npm run typecheck
npm run test
npm run check:repo-size
npm run build
```

## 環境変数

`.env.example` を `.env.local` にコピーして設定します。

- `NEXT_PUBLIC_APP_URL`: アプリURL。ローカルは `http://localhost:3000`
- `NEXT_PUBLIC_APP_NAME`: アプリ名
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase プロジェクト URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key。ブラウザで使用
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SECRET_KEY`: Supabase secret key。サーバー側のみで使用
- `SUPABASE_SERVICE_ROLE_KEY`: サーバー側管理処理用。クライアントへ露出禁止
- `OPENAI_API_KEY`: OpenAI API キー
- `OPENAI_MODEL`: 回答生成モデル
- `EMBEDDING_MODEL`: Embeddings API モデル。初期値は `text-embedding-3-small`
- `EMBEDDING_DIMENSIONS`: Embedding 次元数。初期値は `1536`
- `OPENAI_EMBEDDING_MODEL`: 旧設定名。未設定時の互換用
- `OCR_PROVIDER`: OCRプロバイダ。初期値は `manual`
- `NEXT_PUBLIC_DEFAULT_TENANT_ID`: 初期自治体 ID
- `STORAGE_PROVIDER`: 資料・添付の保存先。初期値は `supabase`
- `ARCHIVE_STORAGE_PROVIDER`: アーカイブ保存先。初期値は `supabase`
- `DOCUMENT_BUCKET`: 資料ファイル用bucket
- `ATTACHMENT_BUCKET`: 案件添付用bucket
- `ARCHIVE_BUCKET`: 旧版・長期保管用bucket
- `BACKUP_BUCKET`: バックアップ用bucket

## OpenAI API 設定

サーバー側の `.env.local` に `OPENAI_API_KEY` を設定します。ブラウザへは露出しません。

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

`OPENAI_API_KEY` が未設定の場合、AI 文章生成は実行せず、検索根拠カードに基づく警告付きフォールバック回答を返します。

Supabase pgvector の `ivfflat` index は 2000 次元を超える `vector` をインデックス化できません。初期設定では `document_chunks.embedding`、検索RPC、OpenAI Embedding生成をすべて1536次元に統一しています。2000次元超のEmbeddingモデルへ変更する場合は、SQL型、RPC引数、既存embedding再生成、インデックス方式を同時に見直してください。

## Supabase Project 作成手順

Supabaseの管理アカウント及びSupabase Project自体は、アプリから自動作成しません。運営者が以下を実施してください。

1. Supabaseで運営者用アカウントを新規作成する。
2. Supabase Dashboardで新しいProjectを作成する。
3. Project SettingsのAPI画面でProject URL、publishable key、secret keyを確認する。
4. `.env.local` 又はVercel環境変数に `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY` を設定する。
5. 初心者向けの手動構築では、Supabase SQL Editorで `supabase/manual-setup/` を番号順に適用する。カテゴリ、タグ、FAQ、プロンプト、チェックリストを投入する前に、必ず `02_auth_org_roles.sql` でデフォルト組織を投入する。
6. Storageで `documents`、`attachments`、`archives`、`backups` bucketを作成し、privateにする。
7. AuthenticationでEmail providerを有効化し、Site URLを `NEXT_PUBLIC_APP_URL`、Redirect URLに `http://localhost:3000/**` と本番の `https://<domain>/**` を登録する。
8. 自由サインアップを無効化し、管理者招待制で運用する。
9. `08_auth_connection.sql` を実行後、初期管理者をSupabase Authに作成し、`bootstrap_auth_user` で所属と管理者ロールを付与する。

メールを別端末やメール内ブラウザで開いても認証できるよう、Authentication > Emailsで次のテンプレートリンクを設定します。

- Magic Link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/consent`
- Invite user: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth/set-password`

`/auth/confirm` はトークンハッシュをサーバー側で検証してCookieセッションを作成します。認証メールのURLやトークンをログ、Issue、チャットへ貼り付けないでください。

`SUPABASE_SECRET_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`OPENAI_API_KEY` はサーバー側のみで使用します。`NEXT_PUBLIC_` を付けず、ブラウザへ露出させないでください。

## アプリ利用者アカウント

アプリ利用者はSupabase Authで管理します。業務アプリのため自由サインアップは使わず、管理者招待制を基本とします。

1. 管理者が `/admin/users` でメールアドレス、表示名、所属 `organization_id`、ロールを指定して招待する。
2. 招待メールからCookieセッションを作成し、初回パスワードを設定する。
3. 以後はメール・パスワード又はマジックリンクでログインする。
4. 初回ログイン時に `/consent` で利用規約、プライバシーポリシー、質問ログ分析に同意する。
5. 同意履歴を `user_consents` に保存する。
6. 同意しない利用者は質問機能を利用できない。
7. 所属とロールは `users.organization_id`、`user_organizations`、`user_roles` に保存し、RLSで制御する。

## 資料登録方法

1. Supabase に `supabase/manual-setup/` のSQLを番号順に適用する。
2. `02_auth_org_roles.sql` でデフォルト組織が存在することを確認してから、`06_seed_master_data.sql` を適用する。
3. `.env.local` に Supabase と OpenAI の環境変数を設定する。
4. `admin`、`system_admin` 又は `super_admin` でログインする。
5. `/admin/documents` で資料名、資料種別、公開範囲、所管、タグ、PDF / TXT / Markdown / XML / RTF を選択し登録する。

登録後、Storage 保存、テキスト抽出、チャンク化、Embedding 生成、`document_chunks` 保存をサーバー側で実行します。テキスト抽出できない PDF は `ocr_required` になります。e-Gov法令はPDFよりXML又はHTML/RTFの方が本文検索用の抽出が安定します。

長いXML/RTFは登録タイムアウトを避けるため、検索対象チャンク数とEmbedding生成数に上限を設けています。上限を超えた本文は分割登録してください。Embedding未生成のチャンクもキーワード検索では検索できます。

資料ファイルは `lib/storage` のStorageAdapter経由で保存します。初期値はSupabase Storageですが、`STORAGE_PROVIDER` を切り替えることでS3、Cloudflare R2、Backblaze B2等へ拡張する設計です。

管理画面の「誤登録を削除」は、資料レコードに `deleted_at`、`deleted_by`、`delete_reason` を残した上で、検索用 `document_chunks` とSupabase Storage上の原本ファイルを削除します。削除後の資料は一覧、検索、AI回答の引用対象から外れます。Storage削除に失敗した場合は監査ログの `metadata.storage_warnings` に記録します。

## 検索処理の流れ

1. 利用者の質問または検索語を受け取る。
2. サーバー側で Embedding を生成する。
3. `hybrid_search_document_chunks` RPC でベクトル類似度、全文検索、資料名、条文番号、タグ、資料種別、所管、カテゴリを組み合わせる。
4. 利用者ロールに応じて公開範囲外の資料と `deleted_at` が入った論理削除済み資料を除外する。
5. 回答生成時は検索結果だけを根拠として Responses API に渡す。
6. 回答、質問ログ、引用根拠を `qa_sessions`、`qa_messages`、`qa_sources` に保存する。

## 案件管理の操作

1. `/cases` で相談案件をカード形式で確認する。
2. 期限超過の案件は赤い警告として表示される。
3. `/cases/new` で相談区分、相談者、地区、市町村、漁協名、漁港名、魚種、AI回答、内部メモ等を入力する。
4. `/cases/[id]` で相談内容、AI回答、根拠資料、対応履歴、紐付けチェックリスト、生成文書を確認する。
5. `/cases/[id]/edit` で案件情報を更新する。

## チェックリストと文書生成

`/checklists` では、漁港利用、補助金、漁協指導、遊漁船業のチェックリストを確認できます。案件詳細からチェックリストへ移動し、進捗を保存する設計です。

案件詳細の「実務向け文書生成」では、漁業者向け説明文、漁協向け指導メモ、庁内協議メモ、法令整理表、手続フロー、不足資料一覧、所管部署照会文案、補助金審査メモ等を生成し、画面上で編集できます。PDFはブラウザ印刷で出力し、Word出力は次PhaseのTODOです。

## 管理・更新・監査

`/admin/documents` では、資料ごとの最終確認日、次回確認日、更新周期、改正有無、影響するFAQ、回答テンプレート、案件を確認します。更新期限を過ぎた資料は警告表示します。

`/admin/documents/[id]/versions` では旧版と新版を並べて表示し、追加・削除の差分を確認できます。実運用では `document_versions` に原本、抽出テキスト、差分JSONを保存し、旧版を上書きしません。

`/admin/logs` では、ログイン、質問、AI回答、資料検索、資料閲覧、資料登録、資料更新、案件登録、文書生成、権限変更、設定変更等を検索します。機密情報は平文保存せず、マスキング後の要約又はハッシュを記録する設計です。

## バックアップと復元

削除は論理削除とし、`deleted_at`、`deleted_by`、`delete_reason` を保存します。資料の誤登録削除では検索チャンクとStorage原本も削除します。正式版の旧版管理が必要な資料は、削除ではなくバージョン管理で差し替えてください。案件は履歴と添付を残します。復元操作は管理者以上に限定し、`backup_restore_events` と `audit_logs` に記録します。

GitHubにはDBダンプ、Storageエクスポート、PDF、写真、Embedding、実案件データを保存しません。バックアップは `BACKUP_BUCKET` 又は管理者指定の外部保存先へ暗号化して保存します。詳細は `docs/storage.md` と `docs/backup.md` を参照してください。

## GitHub容量管理

GitHubに保存する対象は、コード、SQLマイグレーション、最小seed、設計文書、テスト、環境変数例に限定します。法令PDF、添付写真、質問ログ、AI回答履歴、Embedding、DBダンプ、バックアップ、個人情報、実案件データはSupabase又は外部Object Storageに保存します。

`.env.local`、APIキー、Supabase secret key、OpenAI API key、本番dump、PDF、添付画像、質問ログCSVはGitHubへコミットしません。

容量確認:

```bash
npm run check:repo-size
```

`npm run build` 前にも自動実行され、`.env` や実データ用ディレクトリの混入を検知します。

## OCR

画像PDF又は抽出テキストが少ないPDFはOCR対象として扱います。`lib/ocr/provider.ts` の `OcrProvider` インターフェースで外部OCRを差し替えます。初期実装は `ManualOcrProvider` で、外部OCRサービス未契約でも「OCR未処理」「結果確認」「修正」「再チャンク化」「Embedding再生成」の運用フローを設計できます。

外部OCRを使う場合は、`OCR_PROVIDER` を設定し、プロバイダ実装にAPIキー、送信先、保存先、監査ログ、個人情報取扱いを追加してください。

## 音声入力

`/ask` ではブラウザ標準の Web Speech API による音声入力を追加しています。外部APIを使う場合は、録音ファイルをサーバー側へ送信し、APIキーをブラウザへ露出しない構成にします。ブラウザ標準機能は低コストですが端末・ブラウザ差があります。外部APIは精度と統制に優れますが、費用、契約、音声データの個人情報管理が必要です。

## 写真添付

案件詳細で写真添付UIを表示します。現地写真、施設写真、領収書、請求書、漁船、機器、排水状況、市場衛生状況を想定します。Storage接続後はサムネイル生成、拡大表示、権限管理、削除、コメント、撮影日時、EXIF確認を保存します。

## 外部連携

詳細は `docs/external-integrations.md` に記載しています。e-Gov法令API、条例データベース、自治体公式Webサイト、Google Drive、OneDrive、メール通知、カレンダー通知、CSVインポート/エクスポートは、契約、認証、権限、監査、費用を確認してから実接続します。

## オフライン閲覧

PWAのService Workerで、基本画面、資料、案件、チェックリスト、お気に入りをキャッシュ対象にしました。機密資料のオフライン保存は `offline_settings.allow_confidential_offline` で無効化できる設計です。

## カテゴリ運用

- `03_漁港・漁場・漁港施設等活用`: 漁港区域、施設、用地、財産管理、占用、目的外使用、行為許可、漁港施設等活用制度。
- `10_地域振興・浜プラン・海業`: 浜プラン、海業、観光連携、所得向上、交流人口、食育、漁村ツーリズム。
- `12_遊漁船・海洋レジャー・安全管理`: 遊漁船業登録、業務主任者、業務規程、保険、安全管理、事故報告、漁場利用調整。

遊漁船、釣り船、瀬渡し、渡船、体験漁業、業務主任者、業務規程、損害賠償保険、出航判断等の質問はカテゴリ12を優先し、漁港、浜プラン、船舶免許、漁業権、漁協が関係する場合はカテゴリ03、10、05、02、04も横断検索します。

## 質問ログ分析と同意

`/terms`、`/privacy`、`/consent` を追加しています。質問画面では、質問ログが回答履歴、業務改善、研修・FAQ作成、支援ニーズ分析のため管理者により閲覧・分析される可能性を表示し、同意チェック後に質問できます。質問文はサーバー側で `raw_text`、`masked_text`、`ai_sent_text` に分けて保存する設計です。

## 設計上の前提

- Word、Excel、URL 登録は将来拡張用の設計対象で、Phase 1 では PDF、TXT、Markdown、XML、RTF の実処理に対応しています。
- Supabase Auth は未接続のため、同意状態のDB保存、ロール別ログ閲覧、案件保存、チェックリスト進捗保存、生成文書保存の完全な強制は次Phaseで実ユーザーと接続します。Phase 2ではページ、DB、RLS方針、モックデータ、文書生成UIを実装しています。
- 依存関係は 2026-06-13 時点で互換性を優先し、Next.js 15 / React 19 / Tailwind CSS 3 の安定系で固定しています。
- この実行環境には `npm`、`pnpm`、`yarn` が入っていなかったため、依存インストールとビルド確認は Node パッケージマネージャがある環境で実行してください。
- OpenAI 連携は Responses API と Embeddings API をサーバー側 API から呼び出します。
- 資料に根拠がない回答は断定しない方針です。回答 UI には資料名、条文番号、ページ番号、引用箇所、法的効力、更新日を表示します。
- `organizations` を自治体・団体テナントとして扱い、将来の複数自治体展開を前提にしています。
- 個人情報を含む相談記録を扱うため、RLS と役割ベースアクセス制御を前提にしています。
- 文書生成は登録済み資料と案件情報を根拠にする前提です。根拠が不足する場合は、所管部署確認や不足資料として明示します。
- Phase 3の管理画面はモックデータ中心です。Supabase実データへのCRUD接続、実ファイル差分、復元処理の実行は次PhaseでServer Actionへ接続します。
- Phase 4のOCR、写真アップロード、FAQ公開、外部連携、オフライン機密資料制御はDB設計とUI/手順書中心です。外部サービス契約とStorage接続後に実処理へ接続します。
- 大容量データと実データはGitHubへ置かず、Supabase Storage又は外部Object Storageへ保存します。外部Storageの実装はAdapterの差し替え前提で、契約、認証、監査、復元手順を確認してから有効化します。

## 主要ディレクトリ

- `app/`: Next.js 画面ルート
- `components/`: レイアウトと UI コンポーネント
- `lib/`: Supabase 接続、仮データ、ユーティリティ
- `lib/storage/`: Supabase Storageと外部Object Storageの抽象化
- `docs/`: 設計ドキュメント
- `scripts/`: リポジトリ容量チェック等
- `supabase/migrations/`: DB マイグレーション
- `supabase/seed.sql`: 初期データ

## 次の Phase で追加すべき事項

- Supabase Auth のログイン実装
- 利用規約、プライバシーポリシー、質問ログ分析同意の初回ログイン時保存
- ロール別質問履歴、管理者分析、個別ログ閲覧監査
- 案件登録、編集、履歴、添付、チェックリスト進捗、生成文書のServer Action接続
- AI回答から案件へ保存する実データ連携
- 管理画面の資料更新、監査ログ、マスキング設定、復元操作の実DB接続
- Storageを使った相談添付資料の登録と権限制御
- Word出力
- PDF OCR
- Word、Excel、URL 取込
- 資料詳細画面の実 DB 接続とチャンク位置ジャンプ
- 管理画面の登録済み資料一覧の実 DB 接続
- Supabase Auth と画面単位の権限制御
- 相談案件との回答・引用紐付け
- Playwright 等によるモバイル表示テスト
