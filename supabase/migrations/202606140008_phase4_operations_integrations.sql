insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

create table if not exists public.ocr_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  document_version_id uuid references public.document_versions(id) on delete cascade,
  provider text not null default 'manual',
  status text not null default 'required',
  storage_path text,
  page_count integer,
  result_text text,
  result_pages jsonb not null default '[]'::jsonb,
  review_notes text,
  started_by uuid references public.users(id) on delete set null,
  reviewed_by uuid references public.users(id) on delete set null,
  started_at timestamptz,
  reviewed_at timestamptz,
  completed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_photo_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  case_id uuid not null references public.consultation_cases(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  photo_type text not null,
  comment text,
  captured_at timestamptz,
  exif_json jsonb not null default '{}'::jsonb,
  exif_retention_policy text not null default 'strip_location_before_external_use',
  contains_personal_data boolean not null default false,
  visibility text not null default '漁協職員以上',
  uploaded_by uuid references public.users(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.faq_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  question text not null,
  category_id uuid references public.categories(id) on delete set null,
  question_frequency integer not null default 0,
  similar_question_count integer not null default 0,
  rating_summary jsonb not null default '{}'::jsonb,
  source_summary jsonb not null default '[]'::jsonb,
  unresolved_issues text,
  draft_answer text,
  status text not null default 'admin_review',
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  published_faq_id uuid references public.faq_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.answer_feedback
  add column if not exists rating_detail text,
  add column if not exists free_text text,
  add column if not exists source_issue jsonb not null default '{}'::jsonb;

alter table public.organizations
  add column if not exists logo_path text,
  add column if not exists display_name text,
  add column if not exists target_area text,
  add column if not exists tenant_settings jsonb not null default '{}'::jsonb;

create table if not exists public.external_connectors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  connector_type text not null,
  display_name text not null,
  status text not null default 'design',
  config_json jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  sync_error text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, connector_type, display_name)
);

create table if not exists public.offline_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  allow_offline boolean not null default true,
  allow_confidential_offline boolean not null default false,
  cache_recent_documents boolean not null default true,
  cache_favorites boolean not null default true,
  cache_checklists boolean not null default true,
  cache_unsent_notes boolean not null default true,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create index if not exists ocr_jobs_document_idx on public.ocr_jobs(document_id, status, created_at desc);
create index if not exists case_photo_attachments_case_idx on public.case_photo_attachments(case_id, created_at desc) where deleted_at is null;
create index if not exists faq_candidates_org_status_idx on public.faq_candidates(organization_id, status, question_frequency desc);
create index if not exists external_connectors_org_idx on public.external_connectors(organization_id, connector_type);

alter table public.ocr_jobs enable row level security;
alter table public.case_photo_attachments enable row level security;
alter table public.faq_candidates enable row level security;
alter table public.external_connectors enable row level security;
alter table public.offline_settings enable row level security;

drop policy if exists "ocr jobs admin" on public.ocr_jobs;
create policy "ocr jobs admin" on public.ocr_jobs
for all using (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
with check (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')));

drop policy if exists "case photos via case" on public.case_photo_attachments;
create policy "case photos via case" on public.case_photo_attachments
for all using (
  deleted_at is null
  and exists (
    select 1 from public.consultation_cases c
    where c.id = case_id
      and (c.organization_id = public.current_user_org_id() or c.assigned_to = auth.uid() or auth.uid() = any(c.related_user_ids) or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
  )
)
with check (
  exists (
    select 1 from public.consultation_cases c
    where c.id = case_id
      and (c.organization_id = public.current_user_org_id() or c.assigned_to = auth.uid() or auth.uid() = any(c.related_user_ids) or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
  )
);

drop policy if exists "faq candidates admin" on public.faq_candidates;
create policy "faq candidates admin" on public.faq_candidates
for all using (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
with check (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')));

drop policy if exists "external connectors admin" on public.external_connectors;
create policy "external connectors admin" on public.external_connectors
for all using (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
with check (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')));

drop policy if exists "offline settings admin" on public.offline_settings;
create policy "offline settings admin" on public.offline_settings
for all using (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
with check (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')));

insert into public.offline_settings (organization_id)
values ('00000000-0000-0000-0000-000000000000')
on conflict (organization_id) do nothing;
