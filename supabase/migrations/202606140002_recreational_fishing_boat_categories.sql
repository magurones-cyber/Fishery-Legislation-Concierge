insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

alter type public.document_source_type add value if not exists 'form';
alter type public.document_source_type add value if not exists 'procedure_guide';
alter type public.document_source_type add value if not exists 'safety_management_material';
alter type public.document_source_type add value if not exists 'training_material';
alter type public.document_source_type add value if not exists 'business_rules';
alter type public.document_source_type add value if not exists 'accident_report_material';

update public.categories
set
  name = '漁港・漁場・漁港施設等活用',
  description = '漁港区域、漁港施設、漁港用地、財産管理、許認可、占用、目的外使用、漁港施設等活用制度',
  updated_at = now()
where code = '03';

insert into public.categories (organization_id, code, name, description, sort_order)
values (
  '00000000-0000-0000-0000-000000000000',
  '12',
  '遊漁船・海洋レジャー・安全管理',
  '遊漁船業法、登録制度、業務主任者、安全管理、保険、利用者保護、漁場利用調整、兼業支援',
  12
)
on conflict (organization_id, code) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

with parent as (
  select id, organization_id
  from public.categories
  where organization_id = '00000000-0000-0000-0000-000000000000'
    and code = '12'
),
subcategories(code, name, sort_order) as (
  values
    ('12-遊漁船業法', '遊漁船業法', 1),
    ('12-遊漁船業法施行規則', '遊漁船業法施行規則', 2),
    ('12-遊漁船業者登録', '遊漁船業者登録', 3),
    ('12-更新登録', '更新登録', 4),
    ('12-変更届出', '変更届出', 5),
    ('12-廃業届出', '廃業届出', 6),
    ('12-遊漁船業務主任者', '遊漁船業務主任者', 7),
    ('12-業務規程', '業務規程', 8),
    ('12-利用者安全管理', '利用者安全管理', 9),
    ('12-損害賠償保険', '損害賠償保険', 10),
    ('12-出航判断', '出航判断', 11),
    ('12-気象・海象', '気象・海象', 12),
    ('12-事故報告', '事故報告', 13),
    ('12-利用者名簿', '利用者名簿', 14),
    ('12-案内・掲示義務', '案内・掲示義務', 15),
    ('12-漁場利用調整', '漁場利用調整', 16),
    ('12-漁業者の兼業', '漁業者の兼業', 17),
    ('12-体験漁業', '体験漁業', 18),
    ('12-海洋レジャー', '海洋レジャー', 19),
    ('12-観光連携', '観光連携', 20),
    ('12-小型船舶操縦士', '小型船舶操縦士', 21),
    ('12-特定操縦免許', '特定操縦免許', 22),
    ('12-安全講習', '安全講習', 23),
    ('12-FAQ', 'FAQ', 24)
)
insert into public.categories (organization_id, parent_id, code, name, description, sort_order)
select
  parent.organization_id,
  parent.id,
  subcategories.code,
  subcategories.name,
  '12_遊漁船・海洋レジャー・安全管理のサブカテゴリ',
  subcategories.sort_order
from parent
cross join subcategories
on conflict (organization_id, code) do update
set
  parent_id = excluded.parent_id,
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.tags (organization_id, name)
values
  ('00000000-0000-0000-0000-000000000000', '遊漁船'),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業'),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業法'),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業者登録'),
  ('00000000-0000-0000-0000-000000000000', '更新登録'),
  ('00000000-0000-0000-0000-000000000000', '変更届出'),
  ('00000000-0000-0000-0000-000000000000', '業務主任者'),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業務主任者'),
  ('00000000-0000-0000-0000-000000000000', '業務規程'),
  ('00000000-0000-0000-0000-000000000000', '安全管理'),
  ('00000000-0000-0000-0000-000000000000', '損害賠償保険'),
  ('00000000-0000-0000-0000-000000000000', '利用者保護'),
  ('00000000-0000-0000-0000-000000000000', '出航判断'),
  ('00000000-0000-0000-0000-000000000000', '事故報告'),
  ('00000000-0000-0000-0000-000000000000', '利用者名簿'),
  ('00000000-0000-0000-0000-000000000000', '小型船舶操縦士'),
  ('00000000-0000-0000-0000-000000000000', '特定操縦免許'),
  ('00000000-0000-0000-0000-000000000000', '海洋レジャー'),
  ('00000000-0000-0000-0000-000000000000', '体験漁業'),
  ('00000000-0000-0000-0000-000000000000', '漁業者兼業'),
  ('00000000-0000-0000-0000-000000000000', '観光連携'),
  ('00000000-0000-0000-0000-000000000000', '漁場利用調整')
on conflict (organization_id, name) do nothing;

insert into public.question_examples (organization_id, question, sort_order) values
  ('00000000-0000-0000-0000-000000000000', '漁業者が遊漁船業を兼業する場合、どのような手続が必要ですか。', 20),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業者登録に必要な書類は何ですか。', 21),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業務主任者になるにはどのような要件がありますか。', 22),
  ('00000000-0000-0000-0000-000000000000', '遊漁船を出航させる際に業務主任者の乗船は必要ですか。', 23),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業で損害賠償保険への加入は必要ですか。', 24),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業の業務規程には何を記載する必要がありますか。', 25),
  ('00000000-0000-0000-0000-000000000000', '漁協所属の漁業者が遊漁船を始める場合、漁協として確認すべき事項は何ですか。', 26),
  ('00000000-0000-0000-0000-000000000000', '漁業権漁場で遊漁船業を行う場合、漁場利用調整は必要ですか。', 27),
  ('00000000-0000-0000-0000-000000000000', '体験漁業と遊漁船業はどのように区別すべきですか。', 28),
  ('00000000-0000-0000-0000-000000000000', '海業として遊漁船を位置付ける場合、浜プランにはどう記載すべきですか。', 29),
  ('00000000-0000-0000-0000-000000000000', '漁港から遊漁船を出航させる場合、漁港管理上の確認事項は何ですか。', 30),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業の登録更新で確認すべき事項は何ですか。', 31),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業者が事故を起こした場合、どのような報告や対応が必要ですか。', 32)
on conflict (organization_id, question) do update set sort_order = excluded.sort_order;

insert into public.checklists (organization_id, category_id, title, description)
select
  c.organization_id,
  c.id,
  '遊漁船業相談チェック',
  '登録、業務主任者、保険、業務規程、安全管理、漁場利用調整、漁港管理を確認する'
from public.categories c
where c.organization_id = '00000000-0000-0000-0000-000000000000'
  and c.code = '12'
on conflict do nothing;

drop function if exists public.hybrid_search_document_chunks(
  text,
  vector(3072),
  uuid,
  text[],
  uuid,
  text,
  text,
  text,
  integer
);

drop function if exists public.hybrid_search_document_chunks(
  text,
  vector(3072),
  uuid,
  text[],
  uuid,
  text[],
  text,
  text,
  text,
  integer
);

drop function if exists public.hybrid_search_document_chunks(
  text,
  vector(1536),
  uuid,
  text[],
  uuid,
  text,
  text,
  text,
  integer
);

drop function if exists public.hybrid_search_document_chunks(
  text,
  vector(1536),
  uuid,
  text[],
  uuid,
  text[],
  text,
  text,
  text,
  integer
);

create or replace function public.hybrid_search_document_chunks(
  query_text text,
  query_embedding vector(1536),
  organization_id_input uuid,
  readable_visibilities text[],
  category_id_input uuid default null,
  category_codes_input text[] default array[]::text[],
  source_type_input text default null,
  tag_input text default null,
  issuing_authority_input text default null,
  match_count integer default 8
)
returns table (
  chunk_id uuid,
  document_id uuid,
  document_version_id uuid,
  title text,
  source_type text,
  document_number text,
  issuing_authority text,
  last_amended_at date,
  visibility public.document_visibility,
  category_name text,
  category_code text,
  article_number text,
  page_start integer,
  page_end integer,
  heading text,
  content text,
  citation_text text,
  score double precision
)
language sql
stable
as $$
  with query as (
    select
      plainto_tsquery('simple', coalesce(query_text, '')) as tsq,
      lower(coalesce(query_text, '')) as q
  ),
  tagged_documents as (
    select distinct dt.document_id
    from public.document_tags dt
    join public.tags t on t.id = dt.tag_id
    where tag_input is null or t.name ilike '%' || tag_input || '%'
  )
  select
    dc.id as chunk_id,
    d.id as document_id,
    dv.id as document_version_id,
    d.title,
    d.source_type::text,
    d.document_number,
    d.issuing_authority,
    d.last_amended_at,
    d.visibility,
    c.name as category_name,
    c.code as category_code,
    dc.article_number,
    dc.page_start,
    dc.page_end,
    dc.heading,
    dc.content,
    dc.citation_text,
    (
      case when query_embedding is not null and dc.embedding is not null then greatest(0, 1 - (dc.embedding <=> query_embedding)) * 0.52 else 0 end
      + case when dc.search_tsv @@ (select tsq from query) then 0.22 else 0 end
      + case when lower(d.title) like '%' || (select q from query) || '%' then 0.08 else 0 end
      + case when lower(coalesce(dc.article_number, '')) like '%' || (select q from query) || '%' then 0.08 else 0 end
      + case when lower(coalesce(d.document_number, '')) like '%' || (select q from query) || '%' then 0.04 else 0 end
      + case when lower(coalesce(d.issuing_authority, '')) like '%' || (select q from query) || '%' then 0.03 else 0 end
      + case when array_length(category_codes_input, 1) is not null and c.code = any(category_codes_input) then 0.03 else 0 end
    )::double precision as score
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  join public.document_versions dv on dv.id = dc.document_version_id
  left join public.categories c on c.id = d.category_id
  left join public.categories sc on sc.id = d.subcategory_id
  where d.organization_id = organization_id_input
    and d.visibility::text = any(readable_visibilities)
    and d.processing_status = 'searchable'
    and (category_id_input is null or d.category_id = category_id_input or d.subcategory_id = category_id_input)
    and (
      array_length(category_codes_input, 1) is null
      or c.code = any(category_codes_input)
      or sc.code = any(category_codes_input)
    )
    and (source_type_input is null or d.source_type::text = source_type_input)
    and (issuing_authority_input is null or d.issuing_authority ilike '%' || issuing_authority_input || '%')
    and (tag_input is null or d.id in (select document_id from tagged_documents))
    and (
      (query_embedding is not null and dc.embedding is not null)
      or dc.search_tsv @@ (select tsq from query)
      or lower(d.title) like '%' || (select q from query) || '%'
      or lower(coalesce(dc.article_number, '')) like '%' || (select q from query) || '%'
      or lower(coalesce(d.document_number, '')) like '%' || (select q from query) || '%'
      or lower(coalesce(d.issuing_authority, '')) like '%' || (select q from query) || '%'
      or (array_length(category_codes_input, 1) is not null and c.code = any(category_codes_input))
    )
  order by 18 desc, d.updated_at desc
  limit match_count;
$$;
