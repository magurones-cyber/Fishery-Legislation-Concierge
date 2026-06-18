insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

insert into public.checklists (organization_id, title, description)
values
  ('00000000-0000-0000-0000-000000000000', '遊漁船業チェックリスト', '遊漁船業登録、安全管理、主任者、保険、漁場利用調整、漁港利用を確認する'),
  ('00000000-0000-0000-0000-000000000000', '質問ログ分析チェックリスト', '利用目的、マスキング、監査ログ、FAQ候補、研修テーマ、不足資料を確認する')
on conflict do nothing;

with checklist as (
  select id, title
  from public.checklists
  where organization_id = '00000000-0000-0000-0000-000000000000'
    and title in ('遊漁船業チェックリスト', '質問ログ分析チェックリスト')
),
items(title, label, sort_order) as (
  values
    ('遊漁船業チェックリスト', '遊漁船業者登録が必要な事業か', 1),
    ('遊漁船業チェックリスト', '営業所所在地の都道府県手続を確認したか', 2),
    ('遊漁船業チェックリスト', '使用船舶と船舶所有者を確認したか', 3),
    ('遊漁船業チェックリスト', '船舶検査を確認したか', 4),
    ('遊漁船業チェックリスト', '小型船舶操縦士免許と特定操縦免許の要否を確認したか', 5),
    ('遊漁船業チェックリスト', '遊漁船業務主任者の選任、資格要件、講習有効期間を確認したか', 6),
    ('遊漁船業チェックリスト', '業務主任者が乗船する体制か', 7),
    ('遊漁船業チェックリスト', '業務規程の作成と内容を確認したか', 8),
    ('遊漁船業チェックリスト', '損害賠償保険に加入しているか', 9),
    ('遊漁船業チェックリスト', '利用者名簿と安全説明の運用があるか', 10),
    ('遊漁船業チェックリスト', '気象・海象に基づく出航判断基準があるか', 11),
    ('遊漁船業チェックリスト', '事故時の連絡体制と事故報告方法を確認したか', 12),
    ('遊漁船業チェックリスト', '漁業権漁場、漁協、漁業権者との調整を確認したか', 13),
    ('遊漁船業チェックリスト', '漁港から出航する場合の係留、駐車、施設利用を確認したか', 14),
    ('遊漁船業チェックリスト', '浜プラン又は海業との関係を整理したか', 15),
    ('質問ログ分析チェックリスト', '利用目的の範囲内の分析か', 1),
    ('質問ログ分析チェックリスト', '個人情報をマスキングしているか', 2),
    ('質問ログ分析チェックリスト', '個別ログ閲覧が必要な理由があるか', 3),
    ('質問ログ分析チェックリスト', '監査ログが保存されるか', 4),
    ('質問ログ分析チェックリスト', '頻出カテゴリ、不足資料、低信頼度回答を確認したか', 5),
    ('質問ログ分析チェックリスト', 'FAQ化又は研修テーマ化できる質問を抽出したか', 6),
    ('質問ログ分析チェックリスト', '外部共有時に匿名化されているか', 7)
)
insert into public.checklist_items (checklist_id, label, sort_order, is_required)
select checklist.id, items.label, items.sort_order, true
from checklist
join items on items.title = checklist.title
where not exists (
  select 1
  from public.checklist_items existing
  where existing.checklist_id = checklist.id
    and existing.label = items.label
);
