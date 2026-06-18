-- 02_auth_org_roles.sql
-- デフォルト組織とロールを投入します。カテゴリ等のseedより前に必ず実行します。

insert into public.organizations (id, name, organization_type, prefecture, display_name, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000000',
  'デフォルト組織',
  'system',
  '未設定',
  'デフォルト組織',
  now(),
  now()
)
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture,
  display_name = excluded.display_name,
  updated_at = now();

insert into public.roles (name, description) values
  ('general_user', '一般利用者: 公開資料の検索、質問、お気に入り'),
  ('viewer', '検索、質問、案件閲覧を行う利用者'),
  ('fisheries_coop_staff', '漁協職員: 相談記録、漁業者指導記録'),
  ('fisheries_coop_manager', '漁協管理者: 自所属の集計と必要時の個別ログ閲覧'),
  ('municipality_staff', '自治体職員: 漁協指導記録、内部メモ、案件管理'),
  ('municipality_manager', '自治体管理者: 全体集計と必要時の個別ログ閲覧'),
  ('editor', '資料、FAQ、カテゴリを登録・更新できる担当者'),
  ('admin', '管理者: 資料登録、更新、カテゴリ管理、ユーザー管理'),
  ('system_admin', 'システム管理者: 全権限、ログ、設定'),
  ('super_admin', '全自治体を横断管理できる管理者')
on conflict (name) do update
set description = excluded.description;
