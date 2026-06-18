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
