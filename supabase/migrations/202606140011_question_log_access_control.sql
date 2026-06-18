-- 管理者による質問ログ閲覧を、匿名集計と理由必須の個別閲覧に分離する。

insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

alter table public.qa_sessions
  add column if not exists user_organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists user_department text,
  add column if not exists user_role_snapshot text,
  add column if not exists answer_rating text,
  add column if not exists individual_log_access_count integer not null default 0;

create table if not exists public.question_log_access_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  qa_session_id uuid not null references public.qa_sessions(id) on delete cascade,
  viewer_id uuid references public.users(id) on delete set null,
  viewer_role text,
  reason text not null check (reason in (
    '問い合わせ対応',
    '不具合調査',
    'FAQ改善',
    '研修テーマ抽出',
    '不足資料確認',
    '漁協支援',
    '事故・トラブル対応',
    '監査',
    'その他'
  )),
  detail text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists qa_sessions_org_user_org_idx on public.qa_sessions(organization_id, user_organization_id, created_at desc);
create index if not exists qa_sessions_rating_idx on public.qa_sessions(answer_rating, created_at desc);
create index if not exists question_log_access_events_session_idx on public.question_log_access_events(qa_session_id, created_at desc);
create index if not exists question_log_access_events_viewer_idx on public.question_log_access_events(viewer_id, created_at desc);

alter table public.question_log_access_events enable row level security;

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

create or replace function public.can_read_question_log_detail(session_user_id uuid, session_org_id uuid, session_user_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    session_user_id = auth.uid()
    or public.has_role('super_admin')
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

create or replace view public.question_log_analytics_summary
with (security_invoker = true)
as
select
  s.organization_id,
  s.user_organization_id,
  c.name as category_name,
  date_trunc('day', s.created_at)::date as period_date,
  s.confidence_level,
  s.answer_rating,
  jsonb_array_elements_text(coalesce(s.missing_sources, '[]'::jsonb)) as missing_source,
  count(*) as question_count
from public.qa_sessions s
left join public.categories c on c.id = s.category_id
where public.can_read_question_log_summary(s.organization_id, s.user_organization_id)
group by s.organization_id, s.user_organization_id, c.name, date_trunc('day', s.created_at)::date, s.confidence_level, s.answer_rating, jsonb_array_elements_text(coalesce(s.missing_sources, '[]'::jsonb));

drop policy if exists "question log access events insert own" on public.question_log_access_events;
create policy "question log access events insert own" on public.question_log_access_events
for insert
with check (
  viewer_id = auth.uid()
  and exists (
    select 1 from public.qa_sessions s
    where s.id = qa_session_id
      and public.can_read_question_log_detail(s.user_id, s.organization_id, s.user_organization_id)
  )
);

drop policy if exists "question log access events admin read" on public.question_log_access_events;
create policy "question log access events admin read" on public.question_log_access_events
for select
using (
  viewer_id = auth.uid()
  or public.has_role('admin')
  or public.has_role('system_admin')
  or public.has_role('super_admin')
);

drop policy if exists "own qa sessions" on public.qa_sessions;
drop policy if exists "question log sessions scoped read" on public.qa_sessions;
create policy "question log sessions scoped read" on public.qa_sessions
for select
using (public.can_read_question_log_detail(user_id, organization_id, user_organization_id));

drop policy if exists "qa sessions insert own" on public.qa_sessions;
create policy "qa sessions insert own" on public.qa_sessions
for insert
with check (user_id = auth.uid());

drop policy if exists "qa sessions update own or admin" on public.qa_sessions;
create policy "qa sessions update own or admin" on public.qa_sessions
for update
using (
  user_id = auth.uid()
  or public.has_role('admin')
  or public.has_role('system_admin')
  or public.has_role('super_admin')
)
with check (
  user_id = auth.uid()
  or public.has_role('admin')
  or public.has_role('system_admin')
  or public.has_role('super_admin')
);

drop policy if exists "qa messages via session" on public.qa_messages;
drop policy if exists "question log messages scoped read" on public.qa_messages;
create policy "question log messages scoped read" on public.qa_messages
for select
using (exists (
  select 1 from public.qa_sessions s
  where s.id = session_id
    and public.can_read_question_log_detail(s.user_id, s.organization_id, s.user_organization_id)
));

drop policy if exists "qa messages insert own session" on public.qa_messages;
create policy "qa messages insert own session" on public.qa_messages
for insert
with check (exists (
  select 1 from public.qa_sessions s
  where s.id = session_id
    and s.user_id = auth.uid()
));

drop policy if exists "qa sources via message" on public.qa_sources;
drop policy if exists "question log sources scoped read" on public.qa_sources;
create policy "question log sources scoped read" on public.qa_sources
for select
using (exists (
  select 1
  from public.qa_messages m
  join public.qa_sessions s on s.id = m.session_id
  where m.id = message_id
    and public.can_read_question_log_detail(s.user_id, s.organization_id, s.user_organization_id)
));

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
  if access_reason not in ('問い合わせ対応','不具合調査','FAQ改善','研修テーマ抽出','不足資料確認','漁協支援','事故・トラブル対応','監査','その他') then
    raise exception 'invalid access reason';
  end if;

  if access_reason = 'その他' and nullif(trim(coalesce(access_detail, '')), '') is null then
    raise exception 'detail is required for その他';
  end if;

  select * into target_session from public.qa_sessions where id = target_session_id;
  if not found or not public.can_read_question_log_detail(target_session.user_id, target_session.organization_id, target_session.user_organization_id) then
    raise exception 'question log access denied';
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

insert into public.system_settings (organization_id, key, value, description)
select id, 'question_log_access_policy',
  '{"aggregate_is_anonymized": true, "individual_reason_required": true, "audit_required": true, "raw_text_hidden_in_analytics": true}'::jsonb,
  '質問ログ閲覧は匿名集計と理由必須の個別閲覧に分離する。'
from public.organizations
on conflict do nothing;
