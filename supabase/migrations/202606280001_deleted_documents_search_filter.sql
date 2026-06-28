-- Exclude logically deleted documents from RAG search functions.

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
    and d.deleted_at is null
    and (organization_id_input is null or d.organization_id = organization_id_input)
    and d.visibility::text = any(readable_visibilities)
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

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
    and d.deleted_at is null
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
