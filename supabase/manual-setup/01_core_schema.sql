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
