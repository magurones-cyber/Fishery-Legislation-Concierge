# アーキテクチャ

## 概要

本アプリは、Next.js PWA と Supabase を中心にした RAG 型業務支援アプリです。Phase 1 では資料登録、テキスト抽出、チャンク化、Embedding、ハイブリッド検索、根拠付き回答 API を追加しています。

## 技術構成

- フロントエンド: Next.js App Router、TypeScript、Tailwind CSS、shadcn/ui 方針のコンポーネント
- バックエンド: Next.js Server Actions または API Routes
- 認証: Supabase Auth
- DB: Supabase PostgreSQL
- ストレージ: Supabase Storage
- 検索: pgvector、PostgreSQL full text search、条文番号インデックス
- AI: OpenAI Responses API、Embeddings API
- デプロイ: Vercel、Supabase

## RAG の想定フロー

1. 管理者または編集者が資料をアップロードする。
2. Storage に原本を保存し、`documents` と `document_versions` に登録する。
3. PDF、TXT、Markdown をテキスト抽出し、条文番号、見出し、ページ番号を保持してチャンク化する。
4. Embeddings API で `document_chunks.embedding` を生成する。
5. 質問時はベクトル検索、キーワード検索、条文番号検索、カテゴリ、タグ、資料種別、所管を組み合わせる。
6. Responses API に検索結果と制約プロンプトを渡す。
7. 回答には `qa_sources` として引用根拠を保存する。

## アクセス制御

`organizations` をテナント単位とし、`users`、`user_roles`、RLS 関数でアクセス範囲を制御します。相談記録、添付、監査ログは組織単位で分離します。

質問ログ分析では、本人の質問履歴閲覧、所属管理者の集計、自治体管理者の全体分析、権限者の個別ログ閲覧を分けます。個別ログ閲覧は監査ログ保存を前提とします。

## UI 方針

全画面をモバイルファーストにします。下部固定ナビゲーションを主要導線とし、検索と質問に片手で到達できる構成にします。

規約・同意・分析画面もスマートフォンで確認できる構成にし、分析画面には目的外利用禁止の注意書きを表示します。
