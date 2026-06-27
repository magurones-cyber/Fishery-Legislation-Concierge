# UI 設計

## 初期画面

- `/login`: ログイン
- `/dashboard`: トップ画面
- `/ask`: 質問
- `/search`: 資料検索
- `/documents`: 資料一覧
- `/documents/[id]`: 資料詳細
- `/categories`: カテゴリ一覧
- `/favorites`: お気に入り
- `/cases`: 相談案件
- `/cases/new`: 相談案件作成
- `/cases/[id]`: 相談案件詳細
- `/cases/[id]/edit`: 相談案件編集
- `/checklists`: チェックリスト
- `/checklists/[id]`: チェックリスト詳細
- `/admin`: 管理メニュー
- `/admin/documents`: 資料管理
- `/admin/documents/new`: 資料登録
- `/admin/documents/[id]`: 資料詳細
- `/admin/documents/[id]/versions`: 資料バージョン差分
- `/admin/categories`: カテゴリ管理
- `/admin/tags`: タグ管理
- `/admin/users`: ユーザー管理
- `/admin/roles`: ロール管理
- `/admin/logs`: 監査ログ
- `/admin/notifications`: 更新通知
- `/admin/prompts`: プロンプト管理
- `/admin/settings`: 設定

## トップ画面

スマートフォンで最初に質問入力欄へ到達できる構成です。主要操作は「質問する」「資料を検索」の 2 つに絞り、下部固定ナビゲーションからホーム、質問、検索、案件、メニューへ遷移します。

## 表示ルール

- 資料には種類、法的効力、更新日を表示する。
- 回答画面には根拠資料名、条文番号、ページ番号、引用箇所を表示する。
- 空状態は明示する。
- 未接続機能は Phase 0 の制約を画面内で短く表示する。
- 案件一覧はスマートフォン向けカード形式とし、案件番号、件名、相談区分、地区、ステータス、担当者、次回対応日、期限を表示する。
- 期限超過はカード枠と警告文で明確に示す。

## Phase 1 追加 UI

- `/admin/documents`: PDF、TXT、Markdown、XML、RTF 登録フォーム、登録結果、処理エラー表示
- `/search`: ハイブリッド検索フォーム、資料種別・公開ロール・タグ・所管フィルタ、引用カード
- `/ask`: 質問フォーム、初期質問例、根拠付き回答、信頼度、引用カード、根拠不足警告
- `/dashboard`: よく使うメニューに「遊漁船」を追加し、カテゴリ12検索へ遷移

資料登録画面と検索画面では、カテゴリ12と遊漁船業関連タグ、様式・手続案内・安全管理資料・講習資料・業務規程・事故報告資料を選択できます。

## 同意・分析 UI

- `/terms`: 利用規約
- `/privacy`: プライバシーポリシー
- `/consent`: 利用規約、プライバシーポリシー、質問ログ分析への同意
- `/admin/analytics`: 質問ログ分析メニュー
- `/admin/analytics/questions`: マスキング済み質問ログと個別閲覧理由
- `/admin/analytics/categories`: カテゴリ別分析
- `/admin/analytics/missing-sources`: 不足資料候補
- `/admin/analytics/feedback`: FAQ・研修テーマ候補

## Phase 2 追加 UI

- `/cases`: 案件カード一覧、期限超過警告、新規作成導線
- `/cases/new`: 相談区分、相談者、地区、市町村、漁協名、漁港名、魚種、AI回答、内部メモ、タグ、入力テンプレート
- `/cases/[id]`: 案件詳細、AI回答、根拠資料、対応履歴、紐付けチェックリスト、実務向け文書生成
- `/cases/[id]/edit`: 既存案件の編集フォーム
- `/checklists`: 漁港利用、補助金、漁協指導、遊漁船業チェックリスト一覧
- `/checklists/[id]`: チェック項目、進捗、保存導線
- `/favorites`: 法令、条文、通知、FAQ、案件、AI回答、チェックリスト、生成文書をお気に入り対象として表示
- `/admin/users`: 一般利用者、漁協職員、自治体職員、管理者、システム管理者のロール権限表示

生成文書は案件詳細の中で編集可能なMarkdownとして表示し、コピー、Markdown出力、印刷/PDF出力に対応します。Word出力は次PhaseのTODOとしてUI上は無効化します。

## Phase 3 追加 UI

- `/admin/documents`: 更新期限警告、状態、公開範囲、影響範囲をカードで表示
- `/admin/documents/new`: 資料登録と更新必須項目
- `/admin/documents/[id]`: 更新管理、影響FAQ、影響テンプレート、影響案件、論理削除・復元導線
- `/admin/documents/[id]/versions`: 旧版、新版、追加・削除差分
- `/admin/logs`: 期間、ユーザー、操作種別、資料、案件、IPアドレス、結果の検索
- `/admin/settings`: マスキング設定、バックアップ・復元方針
- `/ask`: AI送信前のマスキング確認、回答安全確認、回答評価
