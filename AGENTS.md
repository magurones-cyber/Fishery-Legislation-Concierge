# AGENTS.md

## 開発ルール

- スマートフォン表示を最優先し、片手操作しやすい UI を維持する。
- 登録済み資料に根拠がない内容を断定する実装を追加しない。
- 法律、政令、省令、条例、規則、告示、通知、内部資料、FAQ、過去事例を区別する。
- 回答機能を実装する際は、根拠資料名、条文番号、ページ番号、引用箇所、法的効力、更新日を表示する。
- 個人情報を含む相談記録を扱う前提で、RLS と権限確認を迂回しない。
- 質問ログ分析、個別ログ閲覧、マスキング解除閲覧を追加する場合は、利用者同意、利用目的、監査ログ、マスキングを前提にする。
- 複数自治体展開を前提に、原則として `organization_id` を持つ設計にする。
- UI コンポーネントは既存の `components/ui` と Tailwind のパターンに合わせる。
- GitHubにはコード、SQLマイグレーション、最小seed、テスト、設計文書のみを置き、法令PDF、実添付、Embedding、質問ログ、DBダンプ、バックアップ、個人情報は置かない。
- 資料、写真、証憑、バックアップ、アーカイブは `lib/storage` のStorageAdapter経由で保存先を切り替えられる設計にする。
- 不明点で作業を止めず、妥当な初期値を設定して README の「設計上の前提」に追記する。

## ディレクトリ構造

- `app/`: App Router のページ
- `components/layout/`: アプリ共通レイアウト、ナビゲーション
- `components/ui/`: shadcn/ui 方針の再利用 UI
- `lib/`: Supabase、モックデータ、共通関数
- `lib/storage/`: Supabase Storage又は外部Object Storage向けの保存抽象化
- `docs/`: 設計資料
- `scripts/`: リポジトリ容量チェック等の運用補助
- `supabase/migrations/`: SQL マイグレーション
- `supabase/seed.sql`: 初期 seed

## テスト・確認方法

変更後は原則として以下を実行する。

```bash
npm run lint
npm run typecheck
npm run test
npm run check:repo-size
npm run build
```

フロントエンドの見た目を変えた場合は、スマートフォン幅で `/dashboard`、`/ask`、`/search`、`/documents`、`/documents/[id]` を確認する。

## 禁止事項

- 根拠資料なしに法的判断を断定するプロンプトや UI 文言を追加しない。
- `SUPABASE_SERVICE_ROLE_KEY` をクライアントコンポーネントに渡さない。
- RLS を無効化したまま運用する手順を README に書かない。
- 個人情報を含む相談記録を匿名化せずログや外部 API に送信しない。
- 質問ログの raw text を通常の分析画面に表示しない。
- PDF、Word、Excel、画像、音声、動画、DBダンプ、バックアップ、Embedding、実案件データをGitへ追加しない。
- `.env`、APIキー、サービスロールキー、外部Storage認証情報をGitへ追加しない。
- 既存のユーザー変更を理由なく巻き戻さない。
