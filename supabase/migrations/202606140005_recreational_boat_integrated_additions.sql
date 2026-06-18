insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

alter type public.document_source_type add value if not exists 'registration_application';
alter type public.document_source_type add value if not exists 'renewal_application';
alter type public.document_source_type add value if not exists 'internal_guidance';
alter type public.document_source_type add value if not exists 'consultation_case';

with parent as (
  select id, organization_id
  from public.categories
  where organization_id = '00000000-0000-0000-0000-000000000000'
    and code = '12'
),
subcategories(code, name, sort_order) as (
  values
    ('12-遊漁船業法施行令', '遊漁船業法施行令', 2),
    ('12-観光漁業', '観光漁業', 19)
)
insert into public.categories (organization_id, parent_id, code, name, description, sort_order)
select parent.organization_id, parent.id, subcategories.code, subcategories.name, '12_遊漁船・海洋レジャー・安全管理のサブカテゴリ', subcategories.sort_order
from parent
cross join subcategories
on conflict (organization_id, code) do update
set name = excluded.name, parent_id = excluded.parent_id, updated_at = now();

insert into public.tags (organization_id, name) values
  ('00000000-0000-0000-0000-000000000000', '廃業届出'),
  ('00000000-0000-0000-0000-000000000000', '気象海象'),
  ('00000000-0000-0000-0000-000000000000', '掲示義務'),
  ('00000000-0000-0000-0000-000000000000', '観光漁業'),
  ('00000000-0000-0000-0000-000000000000', '瀬渡し'),
  ('00000000-0000-0000-0000-000000000000', '渡船'),
  ('00000000-0000-0000-0000-000000000000', '釣り船'),
  ('00000000-0000-0000-0000-000000000000', '釣船'),
  ('00000000-0000-0000-0000-000000000000', '船釣り'),
  ('00000000-0000-0000-0000-000000000000', '漁港出航')
on conflict (organization_id, name) do nothing;

insert into public.question_examples (organization_id, question, sort_order) values
  ('00000000-0000-0000-0000-000000000000', '瀬渡しや渡船は遊漁船業に該当しますか。', 33),
  ('00000000-0000-0000-0000-000000000000', '漁業者が自分の漁船に観光客を乗せる場合、遊漁船業登録が必要ですか。', 34)
on conflict (organization_id, question) do update set sort_order = excluded.sort_order;
