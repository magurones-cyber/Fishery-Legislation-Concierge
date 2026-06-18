
-- ============================================================
-- Source: supabase/manual-setup/00_enable_extensions.sql
-- ============================================================
-- 00_enable_extensions.sql
-- Supabase SQL Editorで最初に実行します。

create extension if not exists vector;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- ============================================================
-- Source: supabase/manual-setup/01_core_schema.sql
-- ============================================================
-- 01_core_schema.sql
-- Enumと共通マスタ系の土台を作成します。複数回実行しても止まりにくい形です。

do $$
begin
  create type public.document_source_type as enum (
    'law',
    'cabinet_order',
    'ministerial_ordinance',
    'ordinance',
    'rule',
    'public_notice',
    'notification',
    'guideline',
    'internal_memo',
    'faq',
    'case_record',
    'reference',
    'outline',
    'procedure_manual',
    'form',
    'procedure_guide',
    'safety_management_material',
    'training_material',
    'business_rules',
    'accident_report_material',
    'registration_application',
    'renewal_application',
    'internal_guidance',
    'consultation_case'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.document_visibility as enum (
    'public',
    'fisheries_coop_staff',
    'municipality_staff',
    'admin_only'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.document_processing_status as enum (
    'draft',
    'processing',
    'searchable',
    'ocr_required',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.case_status as enum ('open', 'pending', 'closed', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_role as enum ('user', 'assistant', 'system');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_type text not null default 'municipality',
  prefecture text,
  parent_id uuid references public.organizations(id) on delete set null,
  logo_url text,
  display_name text,
  target_area text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations
  add column if not exists organization_type text not null default 'municipality',
  add column if not exists prefecture text,
  add column if not exists parent_id uuid references public.organizations(id) on delete set null,
  add column if not exists logo_url text,
  add column if not exists display_name text,
  add column if not exists target_area text,
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  display_name text not null,
  email text not null,
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists department text,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table if not exists public.user_organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_in_organization text not null,
  created_at timestamptz not null default now(),
  unique (user_id, organization_id, role_in_organization)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete set null,
  code text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

alter table public.categories
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists parent_id uuid references public.categories(id) on delete set null,
  add column if not exists code text,
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

alter table public.tags
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists name text,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);

alter table public.system_settings
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists key text,
  add column if not exists value jsonb not null default '{}'::jsonb,
  add column if not exists description text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  template text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, name, version)
);

alter table public.prompt_templates
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists name text,
  add column if not exists template text,
  add column if not exists version integer not null default 1,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  question text not null,
  answer text not null,
  source_summary jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, question)
);

alter table public.faq_items
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists question text,
  add column if not exists answer text,
  add column if not exists source_summary jsonb not null default '[]'::jsonb,
  add column if not exists is_published boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, title)
);

alter table public.checklists
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  label text not null,
  description text,
  sort_order integer not null default 0,
  is_required boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.checklist_items
  add column if not exists checklist_id uuid references public.checklists(id) on delete cascade,
  add column if not exists label text,
  add column if not exists description text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_required boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.update_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  body text,
  severity text not null default 'info',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists categories_org_code_idx on public.categories(organization_id, code);
create index if not exists tags_org_name_idx on public.tags(organization_id, name);
create index if not exists user_roles_org_idx on public.user_roles(organization_id);
create index if not exists user_organizations_user_idx on public.user_organizations(user_id);

-- ============================================================
-- Source: supabase/manual-setup/02_auth_org_roles.sql
-- ============================================================
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

-- ============================================================
-- Source: supabase/manual-setup/03_documents_rag_schema.sql
-- ============================================================
-- 03_documents_rag_schema.sql
-- 資料登録、RAG、Embedding、検索関数を作成します。
-- Embeddingはpgvector ivfflatの制限に合わせて1536次元に統一します。

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.categories(id) on delete set null,
  title text not null,
  source_type public.document_source_type not null,
  legal_effect text,
  issuing_authority text,
  document_number text,
  effective_date date,
  published_at date,
  last_reviewed_at date,
  last_amended_at date,
  acquired_at date,
  source_url text,
  visibility public.document_visibility not null default 'admin_only',
  update_cycle text,
  notes text,
  file_format text,
  external_source_type text,
  storage_path text,
  is_public_within_org boolean not null default true,
  processing_status public.document_processing_status not null default 'draft',
  processing_error text,
  processed_at timestamptz,
  current_version_id uuid,
  last_checked_at date,
  next_checked_at date,
  update_owner_id uuid references public.users(id) on delete set null,
  update_reason text,
  update_source_url text,
  has_amendment boolean not null default false,
  impacted_faq jsonb not null default '[]'::jsonb,
  impacted_prompt_templates jsonb not null default '[]'::jsonb,
  impacted_cases jsonb not null default '[]'::jsonb,
  impact_scope text,
  document_state text not null default '公開',
  deleted_at timestamptz,
  deleted_by uuid references public.users(id) on delete set null,
  delete_reason text,
  restored_at timestamptz,
  restored_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists subcategory_id uuid references public.categories(id) on delete set null,
  add column if not exists title text,
  add column if not exists source_type public.document_source_type,
  add column if not exists legal_effect text,
  add column if not exists issuing_authority text,
  add column if not exists document_number text,
  add column if not exists effective_date date,
  add column if not exists published_at date,
  add column if not exists last_reviewed_at date,
  add column if not exists last_amended_at date,
  add column if not exists acquired_at date,
  add column if not exists source_url text,
  add column if not exists visibility public.document_visibility not null default 'admin_only',
  add column if not exists update_cycle text,
  add column if not exists notes text,
  add column if not exists file_format text,
  add column if not exists external_source_type text,
  add column if not exists storage_path text,
  add column if not exists processing_status public.document_processing_status not null default 'draft',
  add column if not exists processing_error text,
  add column if not exists processed_at timestamptz,
  add column if not exists current_version_id uuid,
  add column if not exists last_checked_at date,
  add column if not exists next_checked_at date,
  add column if not exists document_state text not null default '公開',
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_label text not null,
  storage_path text,
  checksum text,
  page_count integer,
  effective_from date,
  effective_to date,
  change_summary text,
  extraction_status public.document_processing_status not null default 'draft',
  extraction_error text,
  status text not null default '公開',
  last_amended_at date,
  acquired_at date,
  source_url text,
  update_owner_id uuid references public.users(id) on delete set null,
  update_reason text,
  old_version_id uuid references public.document_versions(id) on delete set null,
  old_text text,
  new_text text,
  diff_json jsonb not null default '[]'::jsonb,
  impact_scope text,
  visibility text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version_label)
);

alter table public.document_versions
  add column if not exists document_id uuid references public.documents(id) on delete cascade,
  add column if not exists version_label text,
  add column if not exists storage_path text,
  add column if not exists checksum text,
  add column if not exists page_count integer,
  add column if not exists effective_from date,
  add column if not exists effective_to date,
  add column if not exists change_summary text,
  add column if not exists extraction_status public.document_processing_status not null default 'draft',
  add column if not exists extraction_error text,
  add column if not exists status text not null default '公開',
  add column if not exists last_amended_at date,
  add column if not exists acquired_at date,
  add column if not exists source_url text,
  add column if not exists old_text text,
  add column if not exists new_text text,
  add column if not exists diff_json jsonb not null default '[]'::jsonb,
  add column if not exists impact_scope text,
  add column if not exists visibility text,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null,
  page_start integer,
  page_end integer,
  article_number text,
  heading text,
  content text not null,
  citation_text text,
  token_count integer,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  search_tsv tsvector generated always as (to_tsvector('simple', coalesce(article_number, '') || ' ' || coalesce(heading, '') || ' ' || content)) stored,
  created_at timestamptz not null default now(),
  unique (document_version_id, chunk_index)
);

alter table public.document_chunks
  add column if not exists document_version_id uuid references public.document_versions(id) on delete cascade,
  add column if not exists document_id uuid references public.documents(id) on delete cascade,
  add column if not exists chunk_index integer,
  add column if not exists page_start integer,
  add column if not exists page_end integer,
  add column if not exists article_number text,
  add column if not exists heading text,
  add column if not exists content text,
  add column if not exists citation_text text,
  add column if not exists token_count integer,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists embedding vector(1536),
  add column if not exists search_tsv tsvector generated always as (to_tsvector('simple', coalesce(article_number, '') || ' ' || coalesce(heading, '') || ' ' || content)) stored,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.document_tags (
  document_id uuid not null references public.documents(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (document_id, tag_id)
);

alter table public.document_tags
  add column if not exists document_id uuid references public.documents(id) on delete cascade,
  add column if not exists tag_id uuid references public.tags(id) on delete cascade,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.question_examples (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  question text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, question)
);

create index if not exists documents_org_category_idx on public.documents(organization_id, category_id);
create index if not exists documents_source_type_idx on public.documents(source_type);
create index if not exists documents_visibility_idx on public.documents(organization_id, visibility);
create index if not exists documents_processing_status_idx on public.documents(processing_status);
create index if not exists documents_title_trgm_idx on public.documents using gin(title gin_trgm_ops);
create index if not exists documents_issuing_authority_idx on public.documents(issuing_authority);
create index if not exists documents_update_due_idx on public.documents(organization_id, next_checked_at, document_state) where deleted_at is null;
create index if not exists document_versions_document_idx on public.document_versions(document_id);
create index if not exists document_versions_document_status_idx on public.document_versions(document_id, status, created_at desc);
create index if not exists document_chunks_document_idx on public.document_chunks(document_id);
create index if not exists document_chunks_article_idx on public.document_chunks(article_number);
create index if not exists document_chunks_search_idx on public.document_chunks using gin(search_tsv);
create index if not exists document_chunks_embedding_ivfflat_idx on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists document_tags_tag_idx on public.document_tags(tag_id);

drop function if exists public.match_documents(vector(1536), integer, uuid, text[]);

create or replace function public.match_documents(
  query_embedding vector(1536),
  match_count integer default 8,
  organization_id_input uuid default null,
  readable_visibilities text[] default array['public']::text[]
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
  article_number text,
  page_start integer,
  page_end integer,
  heading text,
  content text,
  citation_text text,
  similarity double precision
)
language sql
stable
as $$
  select
    dc.id,
    d.id,
    dv.id,
    d.title,
    d.source_type::text,
    d.document_number,
    d.issuing_authority,
    d.last_amended_at,
    d.visibility,
    c.name,
    dc.article_number,
    dc.page_start,
    dc.page_end,
    dc.heading,
    dc.content,
    dc.citation_text,
    greatest(0, 1 - (dc.embedding <=> query_embedding))::double precision
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  join public.document_versions dv on dv.id = dc.document_version_id
  left join public.categories c on c.id = d.category_id
  where dc.embedding is not null
    and d.processing_status = 'searchable'
    and (organization_id_input is null or d.organization_id = organization_id_input)
    and d.visibility::text = any(readable_visibilities)
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

drop function if exists public.hybrid_search_document_chunks(text, vector(1536), uuid, text[], uuid, text, text, text, integer);
drop function if exists public.hybrid_search_document_chunks(text, vector(1536), uuid, text[], uuid, text[], text, text, text, integer);

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
    select plainto_tsquery('simple', coalesce(query_text, '')) as tsq, lower(coalesce(query_text, '')) as q
  ),
  tagged_documents as (
    select distinct dt.document_id
    from public.document_tags dt
    join public.tags t on t.id = dt.tag_id
    where tag_input is null or t.name ilike '%' || tag_input || '%'
  )
  select
    dc.id,
    d.id,
    dv.id,
    d.title,
    d.source_type::text,
    d.document_number,
    d.issuing_authority,
    d.last_amended_at,
    d.visibility,
    c.name,
    c.code,
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
    )::double precision
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  join public.document_versions dv on dv.id = dc.document_version_id
  left join public.categories c on c.id = d.category_id
  left join public.categories sc on sc.id = d.subcategory_id
  where d.organization_id = organization_id_input
    and d.visibility::text = any(readable_visibilities)
    and d.processing_status = 'searchable'
    and (category_id_input is null or d.category_id = category_id_input or d.subcategory_id = category_id_input)
    and (array_length(category_codes_input, 1) is null or c.code = any(category_codes_input) or sc.code = any(category_codes_input))
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

-- ============================================================
-- Source: supabase/manual-setup/04_qa_logs_analytics_schema.sql
-- ============================================================
-- 04_qa_logs_analytics_schema.sql
-- 質問ログ、案件管理、監査、同意、分析、Phase 4運用テーブルを作成します。

create table if not exists public.qa_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  title text,
  visibility text not null default 'private',
  consent_version text,
  contains_personal_data boolean not null default false,
  anonymized_for_analytics boolean not null default false,
  category_id uuid references public.categories(id) on delete set null,
  confidence_level text,
  missing_sources jsonb not null default '[]'::jsonb,
  feedback text,
  user_organization_id uuid references public.organizations(id) on delete set null,
  user_department text,
  user_role_snapshot text,
  answer_rating text,
  individual_log_access_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.qa_sessions
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists user_id uuid references public.users(id) on delete set null,
  add column if not exists title text,
  add column if not exists visibility text not null default 'private',
  add column if not exists consent_version text,
  add column if not exists contains_personal_data boolean not null default false,
  add column if not exists anonymized_for_analytics boolean not null default false,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists confidence_level text,
  add column if not exists missing_sources jsonb not null default '[]'::jsonb,
  add column if not exists feedback text,
  add column if not exists user_organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists user_department text,
  add column if not exists user_role_snapshot text,
  add column if not exists answer_rating text,
  add column if not exists individual_log_access_count integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.qa_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.qa_sessions(id) on delete cascade,
  role public.message_role not null,
  content text not null,
  raw_text text,
  masked_text text,
  ai_sent_text text,
  contains_personal_data boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.qa_messages
  add column if not exists session_id uuid references public.qa_sessions(id) on delete cascade,
  add column if not exists role public.message_role,
  add column if not exists content text,
  add column if not exists raw_text text,
  add column if not exists masked_text text,
  add column if not exists ai_sent_text text,
  add column if not exists contains_personal_data boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.qa_sources (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.qa_messages(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  document_chunk_id uuid references public.document_chunks(id) on delete set null,
  citation_text text,
  score double precision,
  created_at timestamptz not null default now()
);

alter table public.qa_sources
  add column if not exists message_id uuid references public.qa_messages(id) on delete cascade,
  add column if not exists document_id uuid references public.documents(id) on delete set null,
  add column if not exists document_chunk_id uuid references public.document_chunks(id) on delete set null,
  add column if not exists citation_text text,
  add column if not exists score double precision,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.consultation_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  case_number text,
  title text not null,
  status public.case_status not null default 'open',
  status_label text not null default '未対応',
  consulted_at date,
  consultation_category text,
  requester text,
  requester_type text,
  district text,
  municipality text,
  coop_name text,
  fishing_port text,
  species text,
  fishery_type text,
  consultation_content text,
  ai_answer text,
  source_summary jsonb not null default '[]'::jsonb,
  assignee_name text,
  assigned_to uuid references public.users(id) on delete set null,
  next_action_date date,
  due_date date,
  stakeholders text,
  internal_memo text,
  attachment_summary jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}'::text[],
  visibility text not null default '漁協職員以上',
  related_user_ids uuid[] not null default '{}'::uuid[],
  deleted_at timestamptz,
  deleted_by uuid references public.users(id) on delete set null,
  delete_reason text,
  restored_at timestamptz,
  restored_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.consultation_cases
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists case_number text,
  add column if not exists title text,
  add column if not exists status public.case_status not null default 'open',
  add column if not exists status_label text not null default '未対応',
  add column if not exists consulted_at date,
  add column if not exists consultation_category text,
  add column if not exists requester text,
  add column if not exists requester_type text,
  add column if not exists district text,
  add column if not exists municipality text,
  add column if not exists coop_name text,
  add column if not exists fishing_port text,
  add column if not exists species text,
  add column if not exists fishery_type text,
  add column if not exists consultation_content text,
  add column if not exists ai_answer text,
  add column if not exists source_summary jsonb not null default '[]'::jsonb,
  add column if not exists assignee_name text,
  add column if not exists assigned_to uuid references public.users(id) on delete set null,
  add column if not exists next_action_date date,
  add column if not exists due_date date,
  add column if not exists stakeholders text,
  add column if not exists internal_memo text,
  add column if not exists attachment_summary jsonb not null default '[]'::jsonb,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists visibility text not null default '漁協職員以上',
  add column if not exists related_user_ids uuid[] not null default '{}'::uuid[],
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.consultation_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.consultation_cases(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action_type text not null default 'note',
  handled_at timestamptz not null default now(),
  handler_name text,
  response_type text not null default 'その他',
  content text not null,
  next_action text,
  visibility text not null default '漁協職員以上',
  attachment_summary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.consultation_history
  add column if not exists case_id uuid references public.consultation_cases(id) on delete cascade,
  add column if not exists actor_id uuid references public.users(id) on delete set null,
  add column if not exists action_type text not null default 'note',
  add column if not exists handled_at timestamptz not null default now(),
  add column if not exists handler_name text,
  add column if not exists response_type text not null default 'その他',
  add column if not exists content text,
  add column if not exists next_action text,
  add column if not exists visibility text not null default '漁協職員以上',
  add column if not exists attachment_summary jsonb not null default '[]'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.consultation_attachments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.consultation_cases(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.consultation_attachments
  add column if not exists case_id uuid references public.consultation_cases(id) on delete cascade,
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists uploaded_by uuid references public.users(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  qa_session_id uuid references public.qa_sessions(id) on delete cascade,
  case_id uuid references public.consultation_cases(id) on delete cascade,
  faq_item_id uuid references public.faq_items(id) on delete cascade,
  checklist_id uuid references public.checklists(id) on delete cascade,
  generated_document_id uuid,
  chunk_id uuid references public.document_chunks(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.favorites
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists document_id uuid references public.documents(id) on delete cascade,
  add column if not exists qa_session_id uuid references public.qa_sessions(id) on delete cascade,
  add column if not exists case_id uuid references public.consultation_cases(id) on delete cascade,
  add column if not exists faq_item_id uuid references public.faq_items(id) on delete cascade,
  add column if not exists checklist_id uuid references public.checklists(id) on delete cascade,
  add column if not exists generated_document_id uuid,
  add column if not exists chunk_id uuid references public.document_chunks(id) on delete cascade,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  target_user_id uuid references public.users(id) on delete set null,
  target_organization_id uuid references public.organizations(id) on delete set null,
  target_document_id uuid references public.documents(id) on delete set null,
  target_case_id uuid references public.consultation_cases(id) on delete set null,
  reason text,
  ip_address inet,
  result text not null default 'success',
  masked_payload_hash text,
  metadata_json jsonb not null default '{}'::jsonb,
  search_started_at timestamptz,
  search_ended_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.audit_logs
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists actor_id uuid references public.users(id) on delete set null,
  add column if not exists action text,
  add column if not exists target_table text,
  add column if not exists target_id uuid,
  add column if not exists target_user_id uuid references public.users(id) on delete set null,
  add column if not exists target_organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists target_document_id uuid references public.documents(id) on delete set null,
  add column if not exists target_case_id uuid references public.consultation_cases(id) on delete set null,
  add column if not exists reason text,
  add column if not exists ip_address inet,
  add column if not exists result text not null default 'success',
  add column if not exists masked_payload_hash text,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  terms_version text not null,
  privacy_policy_version text not null,
  log_analysis_consent boolean not null default false,
  consent_type text not null default 'terms',
  consented boolean not null default true,
  consented_at timestamptz,
  ip_address inet,
  user_agent text,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_consents
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists terms_version text,
  add column if not exists privacy_policy_version text,
  add column if not exists log_analysis_consent boolean not null default false,
  add column if not exists consent_type text not null default 'terms',
  add column if not exists consented boolean not null default true,
  add column if not exists consented_at timestamptz,
  add column if not exists ip_address inet,
  add column if not exists user_agent text,
  add column if not exists revoked_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  event_type text not null,
  category_id uuid references public.categories(id) on delete set null,
  target_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.analytics_events
  add column if not exists user_id uuid references public.users(id) on delete set null,
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists event_type text,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists target_id uuid,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.question_log_access_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  qa_session_id uuid not null references public.qa_sessions(id) on delete cascade,
  viewer_id uuid references public.users(id) on delete set null,
  viewer_role text,
  reason text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.question_log_access_events
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists qa_session_id uuid references public.qa_sessions(id) on delete cascade,
  add column if not exists viewer_id uuid references public.users(id) on delete set null,
  add column if not exists viewer_role text,
  add column if not exists reason text,
  add column if not exists detail jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.terms_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  document_type text not null,
  body text not null,
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (version, document_type)
);

alter table public.terms_versions
  add column if not exists version text,
  add column if not exists document_type text,
  add column if not exists body text,
  add column if not exists effective_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.masking_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  key text not null,
  label text not null,
  pattern text,
  replacement text not null,
  is_enabled boolean not null default true,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);

alter table public.masking_settings
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists key text,
  add column if not exists label text,
  add column if not exists pattern text,
  add column if not exists replacement text,
  add column if not exists is_enabled boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.answer_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  qa_session_id uuid references public.qa_sessions(id) on delete cascade,
  qa_message_id uuid references public.qa_messages(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  rating text not null,
  correction_reason text,
  created_at timestamptz not null default now()
);

alter table public.answer_feedback
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists qa_session_id uuid references public.qa_sessions(id) on delete cascade,
  add column if not exists qa_message_id uuid references public.qa_messages(id) on delete cascade,
  add column if not exists user_id uuid references public.users(id) on delete set null,
  add column if not exists rating text,
  add column if not exists correction_reason text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists qa_sessions_user_idx on public.qa_sessions(user_id);
create index if not exists qa_sessions_org_category_idx on public.qa_sessions(organization_id, category_id, created_at desc);
create index if not exists qa_sessions_confidence_idx on public.qa_sessions(confidence_level);
create index if not exists qa_sessions_rating_idx on public.qa_sessions(answer_rating, created_at desc);
create index if not exists consultation_cases_org_status_idx on public.consultation_cases(organization_id, status);
create index if not exists consultation_cases_org_status_due_idx on public.consultation_cases(organization_id, status_label, due_date);
create index if not exists consultation_cases_number_idx on public.consultation_cases(organization_id, case_number);
create index if not exists consultation_history_case_time_idx on public.consultation_history(case_id, handled_at desc);
create index if not exists favorites_user_targets_idx on public.favorites(user_id, created_at desc);
create index if not exists audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);
create index if not exists audit_logs_search_idx on public.audit_logs(organization_id, action, actor_id, created_at desc);
create index if not exists user_consents_user_type_version_idx on public.user_consents(user_id, consent_type, terms_version, privacy_policy_version, created_at desc);
create index if not exists analytics_events_org_type_idx on public.analytics_events(organization_id, event_type, created_at desc);
create index if not exists question_log_access_events_session_idx on public.question_log_access_events(qa_session_id, created_at desc);

-- ============================================================
-- Source: supabase/manual-setup/05_policies.sql
-- ============================================================
-- 05_policies.sql
-- 関数、RLS有効化、policyを再実行可能な形で作成します。

create or replace function public.current_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.users
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = role_name
  );
$$;

create or replace function public.can_read_document_visibility(document_visibility public.document_visibility)
returns boolean
language sql
stable
as $$
  select
    document_visibility = 'public'
    or (document_visibility = 'fisheries_coop_staff' and (
      public.has_role('fisheries_coop_staff') or public.has_role('fisheries_coop_manager') or public.has_role('municipality_staff') or public.has_role('municipality_manager') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')
    ))
    or (document_visibility = 'municipality_staff' and (
      public.has_role('municipality_staff') or public.has_role('municipality_manager') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')
    ))
    or (document_visibility = 'admin_only' and (
      public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')
    ));
$$;

create or replace function public.can_read_question_log_summary(session_org_id uuid, session_user_org_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.has_role('super_admin')
    or (public.has_role('municipality_manager') and session_org_id = public.current_user_org_id())
    or (public.has_role('admin') and session_org_id = public.current_user_org_id())
    or (public.has_role('system_admin') and session_org_id = public.current_user_org_id())
    or (public.has_role('fisheries_coop_manager') and session_user_org_id = public.current_user_org_id());
$$;

create or replace function public.can_read_question_log_detail_admin()
returns boolean
language sql
stable
as $$
  select public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin') or public.has_role('municipality_manager') or public.has_role('fisheries_coop_manager');
$$;

create or replace function public.record_question_log_access(
  target_session_id uuid,
  access_reason text,
  access_detail jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
  session_org uuid;
begin
  if access_reason is null or length(trim(access_reason)) = 0 then
    raise exception 'access_reason is required';
  end if;

  if access_reason not in ('問い合わせ対応', '不具合調査', 'FAQ改善', '研修テーマ抽出', '不足資料確認', '漁協支援', '事故・トラブル対応', '監査', 'その他') then
    raise exception 'invalid access_reason';
  end if;

  if not public.can_read_question_log_detail_admin() then
    raise exception 'admin role required for individual question log access';
  end if;

  select organization_id into session_org
  from public.qa_sessions
  where id = target_session_id;

  insert into public.question_log_access_events (organization_id, qa_session_id, viewer_id, reason, detail)
  values (session_org, target_session_id, auth.uid(), access_reason, access_detail)
  returning id into event_id;

  insert into public.audit_logs (organization_id, actor_id, action, target_table, target_id, reason, metadata_json)
  values (
    session_org,
    auth.uid(),
    'question_log_detail_view',
    'qa_sessions',
    target_session_id,
    access_reason,
    jsonb_build_object('privacy_scope', 'individual_question_log')
  );

  return event_id;
end;
$$;

alter table public.organizations enable row level security;
alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_organizations enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_chunks enable row level security;
alter table public.document_tags enable row level security;
alter table public.qa_sessions enable row level security;
alter table public.qa_messages enable row level security;
alter table public.qa_sources enable row level security;
alter table public.favorites enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_consents enable row level security;
alter table public.consultation_cases enable row level security;
alter table public.consultation_history enable row level security;
alter table public.consultation_attachments enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.faq_items enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.system_settings enable row level security;
alter table public.update_notifications enable row level security;
alter table public.analytics_events enable row level security;
alter table public.question_log_access_events enable row level security;
alter table public.masking_settings enable row level security;
alter table public.answer_feedback enable row level security;
alter table public.question_examples enable row level security;

drop policy if exists "read own organization" on public.organizations;
create policy "read own organization" on public.organizations for select
using (id = public.current_user_org_id() or public.has_role('super_admin'));

drop policy if exists "read roles" on public.roles;
create policy "read roles" on public.roles for select
using (auth.uid() is not null);

drop policy if exists "read same organization users" on public.users;
create policy "read same organization users" on public.users for select
using (organization_id = public.current_user_org_id() or id = auth.uid() or public.has_role('super_admin'));

drop policy if exists "update own profile" on public.users;
create policy "update own profile" on public.users for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "read same organization user roles" on public.user_roles;
create policy "read same organization user roles" on public.user_roles for select
using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));

drop policy if exists "own user organizations" on public.user_organizations;
create policy "own user organizations" on public.user_organizations for select
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "read categories in org" on public.categories;
create policy "read categories in org" on public.categories for select
using (organization_id = public.current_user_org_id() or organization_id is null or public.has_role('super_admin'));

drop policy if exists "manage categories by admin" on public.categories;
create policy "manage categories by admin" on public.categories for all
using (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "read tags in org" on public.tags;
create policy "read tags in org" on public.tags for select
using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));

drop policy if exists "read documents in org by visibility" on public.documents;
create policy "read documents in org by visibility" on public.documents for select
using (
  deleted_at is null
  and (organization_id = public.current_user_org_id() or public.has_role('super_admin'))
  and public.can_read_document_visibility(visibility)
);

drop policy if exists "manage documents by editor" on public.documents;
create policy "manage documents by editor" on public.documents for all
using (public.has_role('admin') or public.has_role('editor') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (public.has_role('admin') or public.has_role('editor') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "read document versions by document visibility" on public.document_versions;
create policy "read document versions by document visibility" on public.document_versions for select
using (exists (
  select 1 from public.documents d
  where d.id = document_id
    and d.deleted_at is null
    and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))
    and public.can_read_document_visibility(d.visibility)
));

drop policy if exists "read document chunks by document visibility" on public.document_chunks;
create policy "read document chunks by document visibility" on public.document_chunks for select
using (exists (
  select 1 from public.documents d
  where d.id = document_id
    and d.deleted_at is null
    and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))
    and public.can_read_document_visibility(d.visibility)
));

drop policy if exists "read document tags via document" on public.document_tags;
create policy "read document tags via document" on public.document_tags for select
using (exists (
  select 1 from public.documents d
  where d.id = document_id
    and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))
));

drop policy if exists "qa sessions own history only" on public.qa_sessions;
create policy "qa sessions own history only" on public.qa_sessions for select
using (user_id = auth.uid() or public.can_read_question_log_summary(organization_id, user_organization_id));

drop policy if exists "qa sessions insert own" on public.qa_sessions;
create policy "qa sessions insert own" on public.qa_sessions for insert
with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "qa sessions update own or admin" on public.qa_sessions;
create policy "qa sessions update own or admin" on public.qa_sessions for update
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "qa messages own history only" on public.qa_messages;
create policy "qa messages own history only" on public.qa_messages for select
using (exists (
  select 1 from public.qa_sessions s
  where s.id = session_id
    and (s.user_id = auth.uid() or public.can_read_question_log_summary(s.organization_id, s.user_organization_id))
));

drop policy if exists "qa messages insert own session" on public.qa_messages;
create policy "qa messages insert own session" on public.qa_messages for insert
with check (exists (
  select 1 from public.qa_sessions s
  where s.id = session_id
    and (s.user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
));

drop policy if exists "qa sources own history only" on public.qa_sources;
create policy "qa sources own history only" on public.qa_sources for select
using (exists (
  select 1
  from public.qa_messages m
  join public.qa_sessions s on s.id = m.session_id
  where m.id = message_id
    and (s.user_id = auth.uid() or public.can_read_question_log_summary(s.organization_id, s.user_organization_id))
));

drop policy if exists "own favorites" on public.favorites;
create policy "own favorites" on public.favorites for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "audit logs admin read" on public.audit_logs;
create policy "audit logs admin read" on public.audit_logs for select
using (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "service insert audit logs" on public.audit_logs;
create policy "service insert audit logs" on public.audit_logs for insert
with check (true);

drop policy if exists "own consents" on public.user_consents;
create policy "own consents" on public.user_consents for select
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "insert own consents" on public.user_consents;
create policy "insert own consents" on public.user_consents for insert
with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "cases in org" on public.consultation_cases;
create policy "cases in org" on public.consultation_cases for all
using (
  deleted_at is null
  and (
    organization_id = public.current_user_org_id()
    or auth.uid() = assigned_to
    or auth.uid() = any(related_user_ids)
    or public.has_role('admin')
    or public.has_role('system_admin')
    or public.has_role('super_admin')
  )
)
with check (
  organization_id = public.current_user_org_id()
  or auth.uid() = assigned_to
  or auth.uid() = any(related_user_ids)
  or public.has_role('admin')
  or public.has_role('system_admin')
  or public.has_role('super_admin')
);

drop policy if exists "case history via case" on public.consultation_history;
create policy "case history via case" on public.consultation_history for all
using (exists (
  select 1 from public.consultation_cases c
  where c.id = case_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
))
with check (exists (
  select 1 from public.consultation_cases c
  where c.id = case_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
));

drop policy if exists "case attachments via case" on public.consultation_attachments;
create policy "case attachments via case" on public.consultation_attachments for all
using (exists (
  select 1 from public.consultation_cases c
  where c.id = case_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
))
with check (exists (
  select 1 from public.consultation_cases c
  where c.id = case_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
));

drop policy if exists "checklists in org" on public.checklists;
create policy "checklists in org" on public.checklists for select
using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));

drop policy if exists "manage checklists by admin" on public.checklists;
create policy "manage checklists by admin" on public.checklists for all
using (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "checklist items via checklist" on public.checklist_items;
create policy "checklist items via checklist" on public.checklist_items for select
using (exists (
  select 1 from public.checklists c
  where c.id = checklist_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('super_admin'))
));

drop policy if exists "faq in org" on public.faq_items;
create policy "faq in org" on public.faq_items for select
using (organization_id = public.current_user_org_id() or is_published = true or public.has_role('super_admin'));

drop policy if exists "prompt templates read admin" on public.prompt_templates;
create policy "prompt templates read admin" on public.prompt_templates for select
using ((organization_id = public.current_user_org_id() and public.has_role('admin')) or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "settings read admin" on public.system_settings;
create policy "settings read admin" on public.system_settings for select
using ((organization_id = public.current_user_org_id() and public.has_role('admin')) or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "notifications in org" on public.update_notifications;
create policy "notifications in org" on public.update_notifications for select
using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));

drop policy if exists "analytics admin read" on public.analytics_events;
create policy "analytics admin read" on public.analytics_events for select
using (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "question log access events insert admin only" on public.question_log_access_events;
create policy "question log access events insert admin only" on public.question_log_access_events for insert
with check (viewer_id = auth.uid() and public.can_read_question_log_detail_admin());

drop policy if exists "question log access events admin read" on public.question_log_access_events;
create policy "question log access events admin read" on public.question_log_access_events for select
using (public.can_read_question_log_detail_admin());

drop policy if exists "masking settings admin" on public.masking_settings;
create policy "masking settings admin" on public.masking_settings for all
using (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
with check (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')));

drop policy if exists "own answer feedback" on public.answer_feedback;
create policy "own answer feedback" on public.answer_feedback for all
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "question examples in org" on public.question_examples;
create policy "question examples in org" on public.question_examples for select
using (organization_id = public.current_user_org_id() or organization_id is null or public.has_role('super_admin'));

-- ============================================================
-- Source: supabase/manual-setup/06_seed_master_data.sql
-- ============================================================
-- 06_seed_master_data.sql
-- 初期マスタデータ。複数回実行しても重複しないようにupsertします。

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
on conflict (name) do update set description = excluded.description;

insert into public.categories (organization_id, code, name, description, sort_order) values
  ('00000000-0000-0000-0000-000000000000', '01', '水産政策・基本法', '水産基本法、国の基本計画、政策通知', 1),
  ('00000000-0000-0000-0000-000000000000', '02', '漁業制度・資源管理', '漁業権、許可、採捕、資源管理', 2),
  ('00000000-0000-0000-0000-000000000000', '03', '漁港・漁場・漁港施設等活用', '漁港区域、漁港施設、漁港用地、財産管理、許認可、占用、目的外使用、漁港施設等活用制度', 3),
  ('00000000-0000-0000-0000-000000000000', '04', '漁協', '水産業協同組合法、定款、員外利用、指導', 4),
  ('00000000-0000-0000-0000-000000000000', '05', '漁船・安全・無線', '漁船登録、改造、機関換装、安全設備、無線', 5),
  ('00000000-0000-0000-0000-000000000000', '06', '経営支援・融資・共済', '経営安定、制度資金、共済、収入安定', 6),
  ('00000000-0000-0000-0000-000000000000', '07', '養殖・防疫・環境', '養殖施設、排水、防疫、環境手続', 7),
  ('00000000-0000-0000-0000-000000000000', '08', '市場・流通・食品衛生', '産地市場、流通、衛生管理、表示', 8),
  ('00000000-0000-0000-0000-000000000000', '09', '自治体財務・補助金', '補助金、交付要綱、財務規則、検査', 9),
  ('00000000-0000-0000-0000-000000000000', '10', '地域振興・浜プラン・海業', '浜プラン、地域振興、観光連携', 10),
  ('00000000-0000-0000-0000-000000000000', '11', '相談事例・運用メモ', '内部運用、FAQ、過去相談、判断メモ', 11),
  ('00000000-0000-0000-0000-000000000000', '12', '遊漁船・海洋レジャー・安全管理', '遊漁船業法、登録制度、業務主任者、安全管理、保険、利用者保護、漁場利用調整、兼業支援', 12),
  ('00000000-0000-0000-0000-000000000000', '99', '経過措置・参考資料', '旧制度、参考資料、経過措置', 99)
on conflict (organization_id, code) do update
set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

with parent as (
  select id, organization_id
  from public.categories
  where organization_id = '00000000-0000-0000-0000-000000000000'
    and code = '12'
),
subcategories(code, name, sort_order) as (
  values
    ('12-遊漁船業法', '遊漁船業法', 1),
    ('12-遊漁船業法施行令', '遊漁船業法施行令', 2),
    ('12-遊漁船業法施行規則', '遊漁船業法施行規則', 3),
    ('12-遊漁船業者登録', '遊漁船業者登録', 4),
    ('12-更新登録', '更新登録', 5),
    ('12-変更届出', '変更届出', 6),
    ('12-廃業届出', '廃業届出', 7),
    ('12-遊漁船業務主任者', '遊漁船業務主任者', 8),
    ('12-業務規程', '業務規程', 9),
    ('12-利用者安全管理', '利用者安全管理', 10),
    ('12-損害賠償保険', '損害賠償保険', 11),
    ('12-出航判断', '出航判断', 12),
    ('12-気象・海象', '気象・海象', 13),
    ('12-事故報告', '事故報告', 14),
    ('12-利用者名簿', '利用者名簿', 15),
    ('12-案内・掲示義務', '案内・掲示義務', 16),
    ('12-漁場利用調整', '漁場利用調整', 17),
    ('12-漁業者の兼業', '漁業者の兼業', 18),
    ('12-体験漁業', '体験漁業', 19),
    ('12-観光漁業', '観光漁業', 20),
    ('12-海洋レジャー', '海洋レジャー', 21),
    ('12-観光連携', '観光連携', 22),
    ('12-小型船舶操縦士', '小型船舶操縦士', 23),
    ('12-特定操縦免許', '特定操縦免許', 24),
    ('12-安全講習', '安全講習', 25),
    ('12-FAQ', 'FAQ', 26)
)
insert into public.categories (organization_id, parent_id, code, name, description, sort_order)
select parent.organization_id, parent.id, subcategories.code, subcategories.name, '12_遊漁船・海洋レジャー・安全管理のサブカテゴリ', subcategories.sort_order
from parent
cross join subcategories
on conflict (organization_id, code) do update
set parent_id = excluded.parent_id, name = excluded.name, description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

insert into public.tags (organization_id, name) values
  ('00000000-0000-0000-0000-000000000000', '遊漁船'),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業'),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業法'),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業者登録'),
  ('00000000-0000-0000-0000-000000000000', '更新登録'),
  ('00000000-0000-0000-0000-000000000000', '変更届出'),
  ('00000000-0000-0000-0000-000000000000', '廃業届出'),
  ('00000000-0000-0000-0000-000000000000', '業務主任者'),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業務主任者'),
  ('00000000-0000-0000-0000-000000000000', '業務規程'),
  ('00000000-0000-0000-0000-000000000000', '安全管理'),
  ('00000000-0000-0000-0000-000000000000', '損害賠償保険'),
  ('00000000-0000-0000-0000-000000000000', '利用者保護'),
  ('00000000-0000-0000-0000-000000000000', '出航判断'),
  ('00000000-0000-0000-0000-000000000000', '気象海象'),
  ('00000000-0000-0000-0000-000000000000', '事故報告'),
  ('00000000-0000-0000-0000-000000000000', '利用者名簿'),
  ('00000000-0000-0000-0000-000000000000', '掲示義務'),
  ('00000000-0000-0000-0000-000000000000', '小型船舶操縦士'),
  ('00000000-0000-0000-0000-000000000000', '特定操縦免許'),
  ('00000000-0000-0000-0000-000000000000', '海洋レジャー'),
  ('00000000-0000-0000-0000-000000000000', '体験漁業'),
  ('00000000-0000-0000-0000-000000000000', '観光漁業'),
  ('00000000-0000-0000-0000-000000000000', '漁業者兼業'),
  ('00000000-0000-0000-0000-000000000000', '観光連携'),
  ('00000000-0000-0000-0000-000000000000', '漁場利用調整'),
  ('00000000-0000-0000-0000-000000000000', '瀬渡し'),
  ('00000000-0000-0000-0000-000000000000', '渡船'),
  ('00000000-0000-0000-0000-000000000000', '釣り船'),
  ('00000000-0000-0000-0000-000000000000', '釣船'),
  ('00000000-0000-0000-0000-000000000000', '船釣り'),
  ('00000000-0000-0000-0000-000000000000', '漁港出航')
on conflict (organization_id, name) do nothing;

insert into public.prompt_templates (organization_id, name, template, version, is_active) values
  ('00000000-0000-0000-0000-000000000000', 'rag_answer_default', '登録済み資料の根拠に基づいて回答する。根拠が不足する場合は断定せず、確認すべき資料と担当部署照会を案内する。回答には資料名、条文番号、ページ番号、引用箇所、法的効力、更新日を含める。', 1, true),
  ('00000000-0000-0000-0000-000000000000', 'document_yugyosen_registration_memo', '遊漁船業者登録相談メモを、登録要否、必要書類、主任者、保険、業務規程、安全管理、漁場利用調整に分けて作成する。', 1, true),
  ('00000000-0000-0000-0000-000000000000', 'document_question_log_analysis_report', '質問ログ分析レポートを、カテゴリ別傾向、不足資料、FAQ候補、研修テーマ候補、支援施策改善案に分けて作成する。', 1, true),
  ('00000000-0000-0000-0000-000000000000', 'phase2_fisher_explanation', '案件情報と根拠資料をもとに、漁業者向け説明文を専門用語の補足付きで作成する。根拠がない事項は要確認とする。', 1, true),
  ('00000000-0000-0000-0000-000000000000', 'phase2_coop_guidance_memo', '漁協向け指導メモを、定款、理事会、総会、組合員資格、員外利用、会計処理、説明責任に分けて作成する。', 1, true),
  ('00000000-0000-0000-0000-000000000000', 'phase2_internal_consultation_memo', '庁内協議メモを、事実関係、根拠、論点、所管確認、行政リスク、次回対応に分けて作成する。', 1, true)
on conflict (organization_id, name, version) do update
set template = excluded.template, is_active = excluded.is_active;

insert into public.checklists (organization_id, title, description) values
  ('00000000-0000-0000-0000-000000000000', '相談回答前チェック', '根拠資料、法的効力、更新日、個人情報を確認する'),
  ('00000000-0000-0000-0000-000000000000', '漁港利用チェックリスト', '漁港区域、施設、財産管理、許認可、補助金財産処分を確認する'),
  ('00000000-0000-0000-0000-000000000000', '補助金チェックリスト', '交付要綱、対象経費、証憑、按分、実績報告、返還条件を確認する'),
  ('00000000-0000-0000-0000-000000000000', '漁協指導チェックリスト', '定款、総会、理事会、員外利用、会計区分、内部統制を確認する'),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業チェックリスト', '登録、安全管理、主任者、保険、漁場利用調整、漁港出航を確認する'),
  ('00000000-0000-0000-0000-000000000000', '質問ログ分析チェックリスト', '利用目的、マスキング、監査ログ、FAQ候補、研修テーマ、不足資料を確認する')
on conflict (organization_id, title) do update
set description = excluded.description, updated_at = now();

with target_checklists as (
  select id, title
  from public.checklists
  where organization_id = '00000000-0000-0000-0000-000000000000'
),
items(title, label, sort_order) as (
  values
    ('漁港利用チェックリスト', '漁港区域内か', 1),
    ('漁港利用チェックリスト', '漁港管理者', 2),
    ('漁港利用チェックリスト', '漁港施設か', 3),
    ('漁港利用チェックリスト', '用地利用計画', 4),
    ('漁港利用チェックリスト', '目的外使用', 5),
    ('漁港利用チェックリスト', '占用', 6),
    ('漁港利用チェックリスト', '行為許可', 7),
    ('漁港利用チェックリスト', '排水処理', 8),
    ('漁港利用チェックリスト', '補助金財産処分', 9),
    ('補助金チェックリスト', '根拠要綱', 1),
    ('補助金チェックリスト', '補助目的', 2),
    ('補助金チェックリスト', '申請者適格', 3),
    ('補助金チェックリスト', '対象経費', 4),
    ('補助金チェックリスト', '消費税', 5),
    ('補助金チェックリスト', '按分', 6),
    ('補助金チェックリスト', '実績報告', 7),
    ('補助金チェックリスト', '返還条件', 8),
    ('漁協指導チェックリスト', '定款', 1),
    ('漁協指導チェックリスト', '総会決議', 2),
    ('漁協指導チェックリスト', '理事会決議', 3),
    ('漁協指導チェックリスト', '組合員資格', 4),
    ('漁協指導チェックリスト', '員外利用', 5),
    ('漁協指導チェックリスト', '会計区分', 6),
    ('漁協指導チェックリスト', '説明責任', 7),
    ('遊漁船業チェックリスト', '遊漁船業者登録が必要な事業か', 1),
    ('遊漁船業チェックリスト', '使用船舶と船舶所有者を確認したか', 2),
    ('遊漁船業チェックリスト', '遊漁船業務主任者の選任を確認したか', 3),
    ('遊漁船業チェックリスト', '業務規程の作成を確認したか', 4),
    ('遊漁船業チェックリスト', '損害賠償保険に加入しているか', 5),
    ('遊漁船業チェックリスト', '利用者名簿と安全説明の運用があるか', 6),
    ('遊漁船業チェックリスト', '事故時の連絡体制と事故報告方法を確認したか', 7),
    ('質問ログ分析チェックリスト', '利用目的の範囲内の分析か', 1),
    ('質問ログ分析チェックリスト', '個人情報をマスキングしているか', 2),
    ('質問ログ分析チェックリスト', '監査ログが保存されるか', 3)
)
insert into public.checklist_items (checklist_id, label, sort_order, is_required)
select target_checklists.id, items.label, items.sort_order, true
from target_checklists
join items on items.title = target_checklists.title
where not exists (
  select 1
  from public.checklist_items existing
  where existing.checklist_id = target_checklists.id
    and existing.label = items.label
);

insert into public.question_examples (organization_id, question, sort_order) values
  ('00000000-0000-0000-0000-000000000000', '漁協が員外利用者へ氷を販売することは可能ですか。', 1),
  ('00000000-0000-0000-0000-000000000000', '漁港用地で試験的な陸上養殖を実施できますか。', 2),
  ('00000000-0000-0000-0000-000000000000', '漁船の機関換装は沿岸漁業改善資金の対象ですか。', 3),
  ('00000000-0000-0000-0000-000000000000', '法人が漁協の組合員になる場合の審査事項は何ですか。', 4),
  ('00000000-0000-0000-0000-000000000000', '補助対象経費に消費税を含めてよいですか。', 5),
  ('00000000-0000-0000-0000-000000000000', '養殖施設の排水について確認すべき法令は何ですか。', 6),
  ('00000000-0000-0000-0000-000000000000', '漁業者が遊漁船業を兼業する場合、どのような手続が必要ですか。', 20),
  ('00000000-0000-0000-0000-000000000000', '遊漁船業者登録に必要な書類は何ですか。', 21),
  ('00000000-0000-0000-0000-000000000000', '瀬渡しや渡船は遊漁船業に該当しますか。', 33)
on conflict (organization_id, question) do update set sort_order = excluded.sort_order;

insert into public.masking_settings (organization_id, key, label, replacement) values
  ('00000000-0000-0000-0000-000000000000', 'person_name', '氏名', '[氏名]'),
  ('00000000-0000-0000-0000-000000000000', 'phone', '電話番号', '[電話番号]'),
  ('00000000-0000-0000-0000-000000000000', 'email', 'メールアドレス', '[メールアドレス]'),
  ('00000000-0000-0000-0000-000000000000', 'address', '住所', '[住所]'),
  ('00000000-0000-0000-0000-000000000000', 'bank_account', '口座情報', '[口座情報]'),
  ('00000000-0000-0000-0000-000000000000', 'business_name', '個別事業者名', '[事業者名]'),
  ('00000000-0000-0000-0000-000000000000', 'vessel_name', '船名', '[船名]')
on conflict (organization_id, key) do update
set label = excluded.label, replacement = excluded.replacement, updated_at = now();

insert into public.system_settings (organization_id, key, value, description)
values
  ('00000000-0000-0000-0000-000000000000', 'embedding', '{"model":"text-embedding-3-small","dimensions":1536}'::jsonb, 'pgvector ivfflatの2000次元制限に合わせたEmbedding設定。'),
  ('00000000-0000-0000-0000-000000000000', 'question_log_access_policy', '{"aggregate_is_anonymized":true,"individual_reason_required":true,"audit_required":true}'::jsonb, '質問ログ閲覧は匿名集計と理由必須の個別閲覧に分離する。')
on conflict (organization_id, key) do update
set value = excluded.value, description = excluded.description, updated_at = now();

insert into public.terms_versions (version, document_type, body)
values
  ('2026-06-14', 'terms', '質問、AI回答、参照資料、利用日時、カテゴリ、評価、添付資料を保存し、管理者が利用目的の範囲内で閲覧・分析することがあります。'),
  ('2026-06-14', 'privacy', '質問ログは業務改善、FAQ改善、研修テーマ抽出、支援ニーズ把握、資料追加のために利用します。分析画面では個人情報をマスキングします。')
on conflict (version, document_type) do nothing;

-- ============================================================
-- Source: supabase/manual-setup/07_storage_notes.sql
-- ============================================================
-- 07_storage_notes.sql
-- Supabase Storage bucketの初期設定です。bucketはprivateを基本にします。

insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('attachments', 'attachments', false),
  ('archives', 'archives', false),
  ('backups', 'backups', false),
  ('consultation-attachments', 'consultation-attachments', false),
  ('generated', 'generated', false)
on conflict (id) do update
set public = false;

-- PDFや添付画像は公開URLではなく、アプリ側で権限確認後に署名付きURLを発行してください。
-- Storage object policyは運用ロール、bucket構成、外部Storage利用有無に応じて調整してください。

drop policy if exists "storage objects no public read" on storage.objects;
create policy "storage objects no public read"
on storage.objects
for select
using (
  bucket_id not in ('documents', 'attachments', 'archives', 'backups', 'consultation-attachments', 'generated')
  or public.has_role('admin')
  or public.has_role('system_admin')
  or public.has_role('super_admin')
);
