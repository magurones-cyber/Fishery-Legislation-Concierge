create extension if not exists "pg_trgm";

alter type public.document_source_type add value if not exists 'outline';
alter type public.document_source_type add value if not exists 'procedure_manual';

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

alter table public.documents
  add column if not exists subcategory_id uuid references public.categories(id) on delete set null,
  add column if not exists document_number text,
  add column if not exists last_amended_at date,
  add column if not exists acquired_at date,
  add column if not exists source_url text,
  add column if not exists visibility public.document_visibility not null default 'admin_only',
  add column if not exists update_cycle text,
  add column if not exists notes text,
  add column if not exists file_format text,
  add column if not exists external_source_type text,
  add column if not exists processing_status public.document_processing_status not null default 'draft',
  add column if not exists processing_error text,
  add column if not exists processed_at timestamptz;

alter table public.document_versions
  add column if not exists extraction_status public.document_processing_status not null default 'draft',
  add column if not exists extraction_error text;

alter table public.document_chunks
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.question_examples (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  question text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, question)
);

alter table public.question_examples enable row level security;

drop policy if exists "question examples in org" on public.question_examples;
create policy "question examples in org" on public.question_examples
for select
using (organization_id = public.current_user_org_id() or organization_id is null or public.has_role('super_admin'));

create index if not exists documents_visibility_idx on public.documents(organization_id, visibility);
create index if not exists documents_processing_status_idx on public.documents(processing_status);
create index if not exists documents_title_trgm_idx on public.documents using gin(title gin_trgm_ops);
create index if not exists documents_issuing_authority_idx on public.documents(issuing_authority);
create index if not exists document_tags_tag_idx on public.document_tags(tag_id);

insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('consultation-attachments', 'consultation-attachments', false),
  ('generated', 'generated', false)
on conflict (id) do nothing;

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
  vector(1536),
  uuid,
  text[],
  uuid,
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
    dc.article_number,
    dc.page_start,
    dc.page_end,
    dc.heading,
    dc.content,
    dc.citation_text,
    (
      case when query_embedding is not null and dc.embedding is not null then greatest(0, 1 - (dc.embedding <=> query_embedding)) * 0.55 else 0 end
      + case when dc.search_tsv @@ (select tsq from query) then 0.22 else 0 end
      + case when lower(d.title) like '%' || (select q from query) || '%' then 0.08 else 0 end
      + case when lower(coalesce(dc.article_number, '')) like '%' || (select q from query) || '%' then 0.08 else 0 end
      + case when lower(coalesce(d.document_number, '')) like '%' || (select q from query) || '%' then 0.04 else 0 end
      + case when lower(coalesce(d.issuing_authority, '')) like '%' || (select q from query) || '%' then 0.03 else 0 end
    )::double precision as score
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  join public.document_versions dv on dv.id = dc.document_version_id
  left join public.categories c on c.id = d.category_id
  where d.organization_id = organization_id_input
    and d.visibility::text = any(readable_visibilities)
    and d.processing_status = 'searchable'
    and d.deleted_at is null
    and (category_id_input is null or d.category_id = category_id_input or d.subcategory_id = category_id_input)
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
    )
  order by 17 desc, d.updated_at desc
  limit match_count;
$$;

drop policy if exists "read documents in org" on public.documents;
create policy "read documents in org by visibility" on public.documents
for select
using (
  organization_id = public.current_user_org_id()
  and (
    visibility = 'public'
    or public.has_role('viewer')
    or public.has_role('editor')
    or public.has_role('admin')
    or public.has_role('super_admin')
  )
);

create policy "service insert audit logs" on public.audit_logs
for insert
with check (true);
