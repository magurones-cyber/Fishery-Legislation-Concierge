insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

alter table public.documents
  add column if not exists current_version_id uuid,
  add column if not exists update_cycle text,
  add column if not exists last_checked_at date,
  add column if not exists next_checked_at date,
  add column if not exists update_owner_id uuid references public.users(id) on delete set null,
  add column if not exists update_reason text,
  add column if not exists update_source_url text,
  add column if not exists has_amendment boolean not null default false,
  add column if not exists impacted_faq jsonb not null default '[]'::jsonb,
  add column if not exists impacted_prompt_templates jsonb not null default '[]'::jsonb,
  add column if not exists impacted_cases jsonb not null default '[]'::jsonb,
  add column if not exists impact_scope text,
  add column if not exists document_state text not null default '公開',
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.users(id) on delete set null,
  add column if not exists delete_reason text,
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references public.users(id) on delete set null;

alter table public.document_versions
  add column if not exists status text not null default '公開',
  add column if not exists last_amended_at date,
  add column if not exists acquired_at date,
  add column if not exists source_url text,
  add column if not exists update_owner_id uuid references public.users(id) on delete set null,
  add column if not exists update_reason text,
  add column if not exists old_version_id uuid references public.document_versions(id) on delete set null,
  add column if not exists old_text text,
  add column if not exists new_text text,
  add column if not exists diff_json jsonb not null default '[]'::jsonb,
  add column if not exists impact_scope text,
  add column if not exists visibility text;

alter table public.consultation_cases
  add column if not exists visibility text not null default '漁協職員以上',
  add column if not exists related_user_ids uuid[] not null default '{}'::uuid[],
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.users(id) on delete set null,
  add column if not exists delete_reason text,
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references public.users(id) on delete set null;

alter table public.audit_logs
  add column if not exists ip_address inet,
  add column if not exists result text not null default 'success',
  add column if not exists masked_payload_hash text,
  add column if not exists target_document_id uuid references public.documents(id) on delete set null,
  add column if not exists target_case_id uuid references public.consultation_cases(id) on delete set null,
  add column if not exists search_started_at timestamptz,
  add column if not exists search_ended_at timestamptz;

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

create table if not exists public.backup_restore_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  reason text,
  result text not null default 'success',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

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

create index if not exists documents_update_due_idx on public.documents(organization_id, next_checked_at, document_state) where deleted_at is null;
create index if not exists documents_deleted_idx on public.documents(organization_id, deleted_at) where deleted_at is not null;
create index if not exists document_versions_document_status_idx on public.document_versions(document_id, status, created_at desc);
create index if not exists consultation_cases_deleted_idx on public.consultation_cases(organization_id, deleted_at) where deleted_at is not null;
create index if not exists audit_logs_search_idx on public.audit_logs(organization_id, action, actor_id, created_at desc);
create index if not exists audit_logs_document_idx on public.audit_logs(target_document_id, created_at desc);
create index if not exists audit_logs_case_idx on public.audit_logs(target_case_id, created_at desc);
create index if not exists backup_restore_events_org_idx on public.backup_restore_events(organization_id, created_at desc);
create index if not exists answer_feedback_session_idx on public.answer_feedback(qa_session_id, created_at desc);

alter table public.masking_settings enable row level security;
alter table public.backup_restore_events enable row level security;
alter table public.answer_feedback enable row level security;

drop policy if exists "masking settings admin" on public.masking_settings;
create policy "masking settings admin" on public.masking_settings
for all
using (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
with check (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')));

drop policy if exists "backup restore admin" on public.backup_restore_events;
create policy "backup restore admin" on public.backup_restore_events
for all
using (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
with check (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')));

drop policy if exists "own answer feedback" on public.answer_feedback;
create policy "own answer feedback" on public.answer_feedback
for all
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "read documents in org by visibility" on public.documents;
create policy "read documents in org by visibility" on public.documents
for select
using (
  deleted_at is null
  and (
    visibility = 'public'
    or (visibility = 'fisheries_coop_staff' and (public.has_role('fisheries_coop_staff') or public.has_role('municipality_staff') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
    or (visibility = 'municipality_staff' and (public.has_role('municipality_staff') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
    or (visibility = 'admin_only' and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
    or public.has_role('super_admin')
  )
  and (organization_id = public.current_user_org_id() or public.has_role('super_admin'))
);

drop policy if exists "cases in org" on public.consultation_cases;
create policy "cases in org" on public.consultation_cases
for all
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

insert into public.masking_settings (organization_id, key, label, replacement) values
  ('00000000-0000-0000-0000-000000000000', 'person_name', '氏名', '[氏名]'),
  ('00000000-0000-0000-0000-000000000000', 'phone', '電話番号', '[電話番号]'),
  ('00000000-0000-0000-0000-000000000000', 'email', 'メールアドレス', '[メールアドレス]'),
  ('00000000-0000-0000-0000-000000000000', 'address', '住所', '[住所]'),
  ('00000000-0000-0000-0000-000000000000', 'bank_account', '口座情報', '[口座情報]'),
  ('00000000-0000-0000-0000-000000000000', 'business_name', '個別事業者名', '[事業者名]'),
  ('00000000-0000-0000-0000-000000000000', 'private_case', '非公開案件名', '[非公開案件名]'),
  ('00000000-0000-0000-0000-000000000000', 'vessel_name', '船名', '[船名]'),
  ('00000000-0000-0000-0000-000000000000', 'registration_number', '登録番号', '[登録番号等]')
on conflict (organization_id, key) do update
set label = excluded.label, replacement = excluded.replacement, updated_at = now();
