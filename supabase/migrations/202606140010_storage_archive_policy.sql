-- Phase追加: GitHub容量を圧迫しないための外部Storage・アーカイブ管理

create table if not exists storage_transfer_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  source_provider text not null default 'supabase',
  source_bucket text not null,
  source_path text not null,
  target_provider text not null default 'supabase',
  target_bucket text not null,
  target_path text not null,
  target_type text not null default 'archive',
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  bytes bigint,
  checksum text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists archive_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  target_table text not null,
  target_id uuid not null,
  data_type text not null,
  original_bucket text,
  original_path text,
  archive_provider text not null default 'supabase',
  archive_bucket text not null,
  archive_path text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'archived' check (status in ('archived', 'restored', 'failed')),
  archived_by uuid references auth.users(id),
  archived_at timestamptz not null default now(),
  restored_by uuid references auth.users(id),
  restored_at timestamptz
);

alter table documents add column if not exists archive_bucket text;
alter table documents add column if not exists archive_path text;
alter table documents add column if not exists archived_at timestamptz;
alter table document_versions add column if not exists archive_bucket text;
alter table document_versions add column if not exists archive_path text;
alter table document_versions add column if not exists archived_at timestamptz;
alter table consultation_attachments add column if not exists archive_bucket text;
alter table consultation_attachments add column if not exists archive_path text;
alter table consultation_attachments add column if not exists archived_at timestamptz;
alter table case_photo_attachments add column if not exists archive_bucket text;
alter table case_photo_attachments add column if not exists archive_path text;
alter table case_photo_attachments add column if not exists archived_at timestamptz;

create index if not exists storage_transfer_jobs_org_status_idx on storage_transfer_jobs(organization_id, status, created_at desc);
create index if not exists archive_records_org_target_idx on archive_records(organization_id, target_table, target_id);
create index if not exists archive_records_status_idx on archive_records(status, archived_at desc);

alter table storage_transfer_jobs enable row level security;
alter table archive_records enable row level security;

drop policy if exists "Admins manage storage transfer jobs" on storage_transfer_jobs;
create policy "Admins manage storage transfer jobs"
  on storage_transfer_jobs
  for all
  using (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
  with check (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')));

drop policy if exists "Admins manage archive records" on archive_records;
create policy "Admins manage archive records"
  on archive_records
  for all
  using (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
  with check (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')));

insert into system_settings (organization_id, key, value, description)
select id, 'storage_policy.github_data_exclusion', '{"enabled": true, "document_bucket": "documents", "attachment_bucket": "attachments", "archive_bucket": "archives", "backup_bucket": "backups"}'::jsonb,
  'GitHubには実資料、添付、Embedding、バックアップ、個人情報を保存しない。'
from organizations
on conflict do nothing;
