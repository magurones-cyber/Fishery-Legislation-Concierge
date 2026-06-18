create extension if not exists "pgcrypto";
create extension if not exists "vector";

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
  'reference'
);

create type public.case_status as enum ('open', 'pending', 'closed', 'archived');
create type public.message_role as enum ('user', 'assistant', 'system');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_type text not null default 'municipality',
  prefecture text,
  created_at timestamptz not null default now()
);

insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  display_name text not null,
  email text not null,
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table public.categories (
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

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  source_type public.document_source_type not null,
  legal_effect text not null,
  issuing_authority text,
  document_number text,
  effective_date date,
  published_at date,
  last_reviewed_at date,
  storage_path text,
  is_public_within_org boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_label text not null,
  storage_path text,
  checksum text,
  page_count integer,
  effective_from date,
  effective_to date,
  change_summary text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version_label)
);

create table public.document_chunks (
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
  embedding vector(1536),
  search_tsv tsvector generated always as (to_tsvector('simple', coalesce(article_number, '') || ' ' || coalesce(heading, '') || ' ' || content)) stored,
  created_at timestamptz not null default now(),
  unique (document_version_id, chunk_index)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.document_tags (
  document_id uuid not null references public.documents(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (document_id, tag_id)
);

create table public.qa_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  title text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.qa_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.qa_sessions(id) on delete cascade,
  role public.message_role not null,
  content text not null,
  model text,
  confidence numeric(4, 3),
  no_source_reason text,
  created_at timestamptz not null default now()
);

create table public.qa_sources (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.qa_messages(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  document_version_id uuid references public.document_versions(id) on delete set null,
  chunk_id uuid references public.document_chunks(id) on delete set null,
  source_rank integer not null default 0,
  page_number integer,
  article_number text,
  quote text,
  score numeric(8, 6),
  created_at timestamptz not null default now()
);

create table public.consultation_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  status public.case_status not null default 'open',
  requester_type text,
  requester_name text,
  contains_personal_data boolean not null default false,
  assigned_to uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consultation_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.consultation_cases(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  body text not null,
  action_type text not null default 'note',
  created_at timestamptz not null default now()
);

create table public.consultation_attachments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.consultation_cases(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  label text not null,
  description text,
  sort_order integer not null default 0,
  is_required boolean not null default false
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  qa_session_id uuid references public.qa_sessions(id) on delete cascade,
  case_id uuid references public.consultation_cases(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((document_id is not null)::integer + (qa_session_id is not null)::integer + (case_id is not null)::integer = 1)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);

create table public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  template text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, name, version)
);

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  question text not null,
  answer text not null,
  source_document_id uuid references public.documents(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.update_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  title text not null,
  body text,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index categories_parent_idx on public.categories(parent_id);
create index documents_org_category_idx on public.documents(organization_id, category_id);
create index documents_source_type_idx on public.documents(source_type);
create index document_versions_document_idx on public.document_versions(document_id);
create index document_chunks_document_idx on public.document_chunks(document_id);
create index document_chunks_article_idx on public.document_chunks(article_number);
create index document_chunks_search_idx on public.document_chunks using gin(search_tsv);
create index if not exists document_chunks_embedding_idx on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index qa_sessions_user_idx on public.qa_sessions(user_id);
create index consultation_cases_org_status_idx on public.consultation_cases(organization_id, status);
create index audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);

create or replace function public.current_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.users where id = auth.uid()
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
  )
$$;

alter table public.organizations enable row level security;
alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_chunks enable row level security;
alter table public.tags enable row level security;
alter table public.document_tags enable row level security;
alter table public.qa_sessions enable row level security;
alter table public.qa_messages enable row level security;
alter table public.qa_sources enable row level security;
alter table public.consultation_cases enable row level security;
alter table public.consultation_history enable row level security;
alter table public.consultation_attachments enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.favorites enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.faq_items enable row level security;
alter table public.update_notifications enable row level security;

create policy "read own organization" on public.organizations for select using (id = public.current_user_org_id() or public.has_role('super_admin'));
create policy "read roles" on public.roles for select using (auth.uid() is not null);
create policy "read same organization users" on public.users for select using (organization_id = public.current_user_org_id() or id = auth.uid() or public.has_role('super_admin'));
create policy "update own profile" on public.users for update using (id = auth.uid()) with check (id = auth.uid());
create policy "read same organization user roles" on public.user_roles for select using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));

create policy "read categories in org" on public.categories for select using (organization_id = public.current_user_org_id() or organization_id is null or public.has_role('super_admin'));
create policy "manage categories by admin" on public.categories for all using (public.has_role('admin') or public.has_role('super_admin')) with check (public.has_role('admin') or public.has_role('super_admin'));

create policy "read documents in org" on public.documents for select using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));
create policy "manage documents by editor" on public.documents for all using (public.has_role('admin') or public.has_role('editor') or public.has_role('super_admin')) with check (public.has_role('admin') or public.has_role('editor') or public.has_role('super_admin'));
create policy "read document versions in org" on public.document_versions for select using (exists (select 1 from public.documents d where d.id = document_id and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))));
create policy "read document chunks in org" on public.document_chunks for select using (exists (select 1 from public.documents d where d.id = document_id and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))));

create policy "read tags in org" on public.tags for select using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));
create policy "read document tags via document" on public.document_tags for select using (exists (select 1 from public.documents d where d.id = document_id and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))));

create policy "own qa sessions" on public.qa_sessions for all using (user_id = auth.uid() or public.has_role('admin') or public.has_role('super_admin')) with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('super_admin'));
create policy "qa messages via session" on public.qa_messages for all using (exists (select 1 from public.qa_sessions s where s.id = session_id and (s.user_id = auth.uid() or public.has_role('admin') or public.has_role('super_admin')))) with check (exists (select 1 from public.qa_sessions s where s.id = session_id and (s.user_id = auth.uid() or public.has_role('admin') or public.has_role('super_admin'))));
create policy "qa sources via message" on public.qa_sources for select using (exists (select 1 from public.qa_messages m join public.qa_sessions s on s.id = m.session_id where m.id = message_id and (s.user_id = auth.uid() or public.has_role('admin') or public.has_role('super_admin'))));

create policy "cases in org" on public.consultation_cases for all using (organization_id = public.current_user_org_id() or public.has_role('super_admin')) with check (organization_id = public.current_user_org_id() or public.has_role('super_admin'));
create policy "case history via case" on public.consultation_history for all using (exists (select 1 from public.consultation_cases c where c.id = case_id and (c.organization_id = public.current_user_org_id() or public.has_role('super_admin')))) with check (exists (select 1 from public.consultation_cases c where c.id = case_id and (c.organization_id = public.current_user_org_id() or public.has_role('super_admin'))));
create policy "case attachments via case" on public.consultation_attachments for all using (exists (select 1 from public.consultation_cases c where c.id = case_id and (c.organization_id = public.current_user_org_id() or public.has_role('super_admin')))) with check (exists (select 1 from public.consultation_cases c where c.id = case_id and (c.organization_id = public.current_user_org_id() or public.has_role('super_admin'))));

create policy "checklists in org" on public.checklists for select using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));
create policy "checklist items via checklist" on public.checklist_items for select using (exists (select 1 from public.checklists c where c.id = checklist_id and (c.organization_id = public.current_user_org_id() or public.has_role('super_admin'))));
create policy "own favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "audit read admin" on public.audit_logs for select using (public.has_role('admin') or public.has_role('super_admin'));
create policy "settings read admin" on public.system_settings for select using (organization_id = public.current_user_org_id() and public.has_role('admin') or public.has_role('super_admin'));
create policy "prompt templates read admin" on public.prompt_templates for select using (organization_id = public.current_user_org_id() and public.has_role('admin') or public.has_role('super_admin'));
create policy "faq in org" on public.faq_items for select using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));
create policy "notifications in org" on public.update_notifications for select using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));
