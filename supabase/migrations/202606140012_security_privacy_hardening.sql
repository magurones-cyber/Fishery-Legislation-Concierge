-- Supabase漏洩リスク低減: RLS、個別ログ監査、Storage private運用、同意履歴を明確化する。

insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

alter table public.qa_sessions enable row level security;
alter table public.qa_messages enable row level security;
alter table public.qa_sources enable row level security;
alter table public.consultation_cases enable row level security;
alter table public.favorites enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_consents enable row level security;

alter table public.user_consents
  add column if not exists consent_type text not null default 'terms',
  add column if not exists consented boolean not null default true,
  add column if not exists ip_address inet,
  add column if not exists user_agent text;

create index if not exists user_consents_user_type_version_idx on public.user_consents(user_id, consent_type, terms_version, privacy_policy_version, created_at desc);

drop policy if exists "question log sessions scoped read" on public.qa_sessions;
drop policy if exists "qa sessions own history only" on public.qa_sessions;
create policy "qa sessions own history only" on public.qa_sessions
for select
using (user_id = auth.uid());

drop policy if exists "qa sessions insert own" on public.qa_sessions;
create policy "qa sessions insert own"
on public.qa_sessions
for insert
with check (user_id = auth.uid() or auth.uid() is null);

drop policy if exists "qa sessions update own or admin" on public.qa_sessions;
create policy "qa sessions update own or admin"
on public.qa_sessions
for update
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "question log messages scoped read" on public.qa_messages;
drop policy if exists "qa messages own history only" on public.qa_messages;
create policy "qa messages own history only" on public.qa_messages
for select
using (exists (
  select 1 from public.qa_sessions s
  where s.id = session_id
    and s.user_id = auth.uid()
));

drop policy if exists "qa messages insert own session" on public.qa_messages;
create policy "qa messages insert own session" on public.qa_messages
for insert
with check (exists (
  select 1 from public.qa_sessions s
  where s.id = session_id
    and (s.user_id = auth.uid() or auth.uid() is null)
));

drop policy if exists "question log sources scoped read" on public.qa_sources;
drop policy if exists "qa sources own history only" on public.qa_sources;
create policy "qa sources own history only" on public.qa_sources
for select
using (exists (
  select 1
  from public.qa_messages m
  join public.qa_sessions s on s.id = m.session_id
  where m.id = message_id
    and s.user_id = auth.uid()
));

create or replace function public.can_read_question_log_summary(session_org_id uuid, session_user_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.has_role('super_admin')
    or public.has_role('system_admin')
    or public.has_role('admin')
    or (
      public.has_role('municipality_manager')
      and session_org_id = public.current_user_org_id()
    )
    or (
      public.has_role('fisheries_coop_manager')
      and session_user_org_id = public.current_user_org_id()
    )
$$;

create or replace function public.can_read_question_log_detail_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')
$$;

create or replace function public.get_question_log_analytics_summary()
returns table (
  organization_id uuid,
  user_organization_id uuid,
  category_name text,
  period_date date,
  confidence_level text,
  answer_rating text,
  missing_source text,
  question_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.organization_id,
    s.user_organization_id,
    c.name as category_name,
    date_trunc('day', s.created_at)::date as period_date,
    s.confidence_level,
    s.answer_rating,
    missing.value as missing_source,
    count(*) as question_count
  from public.qa_sessions s
  left join public.categories c on c.id = s.category_id
  left join lateral jsonb_array_elements_text(coalesce(s.missing_sources, '[]'::jsonb)) as missing(value) on true
  where public.can_read_question_log_summary(s.organization_id, s.user_organization_id)
  group by s.organization_id, s.user_organization_id, c.name, date_trunc('day', s.created_at)::date, s.confidence_level, s.answer_rating, missing.value;
$$;

create or replace function public.record_question_log_access(
  target_session_id uuid,
  access_reason text,
  access_detail text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
  target_session public.qa_sessions%rowtype;
begin
  if not public.can_read_question_log_detail_admin() then
    raise exception 'admin role required for individual question log access';
  end if;

  if access_reason not in ('問い合わせ対応','不具合調査','FAQ改善','研修テーマ抽出','不足資料確認','漁協支援','事故・トラブル対応','監査','その他') then
    raise exception 'invalid access reason';
  end if;

  if access_reason = 'その他' and nullif(trim(coalesce(access_detail, '')), '') is null then
    raise exception 'detail is required for その他';
  end if;

  select * into target_session from public.qa_sessions where id = target_session_id;
  if not found then
    raise exception 'question log not found';
  end if;

  insert into public.question_log_access_events (organization_id, qa_session_id, viewer_id, reason, detail)
  values (target_session.organization_id, target_session_id, auth.uid(), access_reason, nullif(trim(coalesce(access_detail, '')), ''))
  returning id into event_id;

  update public.qa_sessions
  set individual_log_access_count = individual_log_access_count + 1,
      updated_at = now()
  where id = target_session_id;

  insert into public.audit_logs (organization_id, actor_id, action, target_table, target_id, reason, metadata_json)
  values (
    target_session.organization_id,
    auth.uid(),
    'question_log_detail_view',
    'qa_sessions',
    target_session_id,
    access_reason,
    jsonb_build_object('detail_present', access_detail is not null, 'privacy_scope', 'individual_question_log')
  );

  return event_id;
end;
$$;

drop policy if exists "question log access events insert own" on public.question_log_access_events;
create policy "question log access events insert admin only"
on public.question_log_access_events
for insert
with check (viewer_id = auth.uid() and public.can_read_question_log_detail_admin());

drop policy if exists "question log access events admin read" on public.question_log_access_events;
create policy "question log access events admin read"
on public.question_log_access_events
for select
using (viewer_id = auth.uid() or public.can_read_question_log_detail_admin());

drop policy if exists "audit read admin" on public.audit_logs;
drop policy if exists "audit logs admin read" on public.audit_logs;
create policy "audit logs admin read"
on public.audit_logs
for select
using (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "own favorites" on public.favorites;
create policy "own favorites"
on public.favorites
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "own consents" on public.user_consents;
create policy "own consents"
on public.user_consents
for select
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "insert own consents" on public.user_consents;
create policy "insert own consents"
on public.user_consents
for insert
with check (user_id = auth.uid());

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    update storage.buckets
    set public = false
    where id in ('documents', 'attachments', 'archives', 'backups', 'consultation-attachments', 'generated');
  end if;
end $$;

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

insert into public.system_settings (organization_id, key, value, description)
select id, 'privacy_security_hardening',
  '{
    "qa_history_select": "owner_only",
    "manager_access": "aggregate_only",
    "individual_log_access": "admin_rpc_with_reason_and_audit",
    "storage_default": "private_signed_url",
    "question_text_fields": ["raw_text", "masked_text", "ai_sent_text"],
    "git_exclusions": [".env", "api_keys", "production_dump", "pdf", "attachments", "question_log_csv"]
  }'::jsonb,
  'Supabase保存データの漏洩リスク低減方針。'
from public.organizations
on conflict do nothing;
