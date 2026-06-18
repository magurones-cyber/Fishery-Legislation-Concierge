-- 05_policies.sql
-- 関数、RLS有効化、policyを再実行可能な形で作成します。

create or replace function public.current_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.users
  where id = auth.uid()
  limit 1;
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
  );
$$;

create or replace function public.can_read_document_visibility(document_visibility public.document_visibility)
returns boolean
language sql
stable
as $$
  select
    document_visibility = 'public'
    or (document_visibility = 'fisheries_coop_staff' and (
      public.has_role('fisheries_coop_staff') or public.has_role('fisheries_coop_manager') or public.has_role('municipality_staff') or public.has_role('municipality_manager') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')
    ))
    or (document_visibility = 'municipality_staff' and (
      public.has_role('municipality_staff') or public.has_role('municipality_manager') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')
    ))
    or (document_visibility = 'admin_only' and (
      public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')
    ));
$$;

create or replace function public.can_read_question_log_summary(session_org_id uuid, session_user_org_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.has_role('super_admin')
    or (public.has_role('municipality_manager') and session_org_id = public.current_user_org_id())
    or (public.has_role('admin') and session_org_id = public.current_user_org_id())
    or (public.has_role('system_admin') and session_org_id = public.current_user_org_id())
    or (public.has_role('fisheries_coop_manager') and session_user_org_id = public.current_user_org_id());
$$;

create or replace function public.can_read_question_log_detail_admin()
returns boolean
language sql
stable
as $$
  select public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin') or public.has_role('municipality_manager') or public.has_role('fisheries_coop_manager');
$$;

create or replace function public.record_question_log_access(
  target_session_id uuid,
  access_reason text,
  access_detail jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
  session_org uuid;
begin
  if access_reason is null or length(trim(access_reason)) = 0 then
    raise exception 'access_reason is required';
  end if;

  if access_reason not in ('問い合わせ対応', '不具合調査', 'FAQ改善', '研修テーマ抽出', '不足資料確認', '漁協支援', '事故・トラブル対応', '監査', 'その他') then
    raise exception 'invalid access_reason';
  end if;

  if not public.can_read_question_log_detail_admin() then
    raise exception 'admin role required for individual question log access';
  end if;

  select organization_id into session_org
  from public.qa_sessions
  where id = target_session_id;

  insert into public.question_log_access_events (organization_id, qa_session_id, viewer_id, reason, detail)
  values (session_org, target_session_id, auth.uid(), access_reason, access_detail)
  returning id into event_id;

  insert into public.audit_logs (organization_id, actor_id, action, target_table, target_id, reason, metadata_json)
  values (
    session_org,
    auth.uid(),
    'question_log_detail_view',
    'qa_sessions',
    target_session_id,
    access_reason,
    jsonb_build_object('privacy_scope', 'individual_question_log')
  );

  return event_id;
end;
$$;

alter table public.organizations enable row level security;
alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_organizations enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_chunks enable row level security;
alter table public.document_tags enable row level security;
alter table public.qa_sessions enable row level security;
alter table public.qa_messages enable row level security;
alter table public.qa_sources enable row level security;
alter table public.favorites enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_consents enable row level security;
alter table public.consultation_cases enable row level security;
alter table public.consultation_history enable row level security;
alter table public.consultation_attachments enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.faq_items enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.system_settings enable row level security;
alter table public.update_notifications enable row level security;
alter table public.analytics_events enable row level security;
alter table public.question_log_access_events enable row level security;
alter table public.masking_settings enable row level security;
alter table public.answer_feedback enable row level security;
alter table public.question_examples enable row level security;

drop policy if exists "read own organization" on public.organizations;
create policy "read own organization" on public.organizations for select
using (id = public.current_user_org_id() or public.has_role('super_admin'));

drop policy if exists "read roles" on public.roles;
create policy "read roles" on public.roles for select
using (auth.uid() is not null);

drop policy if exists "read same organization users" on public.users;
create policy "read same organization users" on public.users for select
using (organization_id = public.current_user_org_id() or id = auth.uid() or public.has_role('super_admin'));

drop policy if exists "update own profile" on public.users;
create policy "update own profile" on public.users for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "read same organization user roles" on public.user_roles;
create policy "read same organization user roles" on public.user_roles for select
using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));

drop policy if exists "own user organizations" on public.user_organizations;
create policy "own user organizations" on public.user_organizations for select
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "read categories in org" on public.categories;
create policy "read categories in org" on public.categories for select
using (organization_id = public.current_user_org_id() or organization_id is null or public.has_role('super_admin'));

drop policy if exists "manage categories by admin" on public.categories;
create policy "manage categories by admin" on public.categories for all
using (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "read tags in org" on public.tags;
create policy "read tags in org" on public.tags for select
using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));

drop policy if exists "read documents in org by visibility" on public.documents;
create policy "read documents in org by visibility" on public.documents for select
using (
  deleted_at is null
  and (organization_id = public.current_user_org_id() or public.has_role('super_admin'))
  and public.can_read_document_visibility(visibility)
);

drop policy if exists "manage documents by editor" on public.documents;
create policy "manage documents by editor" on public.documents for all
using (public.has_role('admin') or public.has_role('editor') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (public.has_role('admin') or public.has_role('editor') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "read document versions by document visibility" on public.document_versions;
create policy "read document versions by document visibility" on public.document_versions for select
using (exists (
  select 1 from public.documents d
  where d.id = document_id
    and d.deleted_at is null
    and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))
    and public.can_read_document_visibility(d.visibility)
));

drop policy if exists "read document chunks by document visibility" on public.document_chunks;
create policy "read document chunks by document visibility" on public.document_chunks for select
using (exists (
  select 1 from public.documents d
  where d.id = document_id
    and d.deleted_at is null
    and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))
    and public.can_read_document_visibility(d.visibility)
));

drop policy if exists "read document tags via document" on public.document_tags;
create policy "read document tags via document" on public.document_tags for select
using (exists (
  select 1 from public.documents d
  where d.id = document_id
    and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))
));

drop policy if exists "qa sessions own history only" on public.qa_sessions;
create policy "qa sessions own history only" on public.qa_sessions for select
using (user_id = auth.uid() or public.can_read_question_log_summary(organization_id, user_organization_id));

drop policy if exists "qa sessions insert own" on public.qa_sessions;
create policy "qa sessions insert own" on public.qa_sessions for insert
with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "qa sessions update own or admin" on public.qa_sessions;
create policy "qa sessions update own or admin" on public.qa_sessions for update
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "qa messages own history only" on public.qa_messages;
create policy "qa messages own history only" on public.qa_messages for select
using (exists (
  select 1 from public.qa_sessions s
  where s.id = session_id
    and (s.user_id = auth.uid() or public.can_read_question_log_summary(s.organization_id, s.user_organization_id))
));

drop policy if exists "qa messages insert own session" on public.qa_messages;
create policy "qa messages insert own session" on public.qa_messages for insert
with check (exists (
  select 1 from public.qa_sessions s
  where s.id = session_id
    and (s.user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
));

drop policy if exists "qa sources own history only" on public.qa_sources;
create policy "qa sources own history only" on public.qa_sources for select
using (exists (
  select 1
  from public.qa_messages m
  join public.qa_sessions s on s.id = m.session_id
  where m.id = message_id
    and (s.user_id = auth.uid() or public.can_read_question_log_summary(s.organization_id, s.user_organization_id))
));

drop policy if exists "own favorites" on public.favorites;
create policy "own favorites" on public.favorites for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "audit logs admin read" on public.audit_logs;
create policy "audit logs admin read" on public.audit_logs for select
using (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "service insert audit logs" on public.audit_logs;
create policy "service insert audit logs" on public.audit_logs for insert
with check (true);

drop policy if exists "own consents" on public.user_consents;
create policy "own consents" on public.user_consents for select
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "insert own consents" on public.user_consents;
create policy "insert own consents" on public.user_consents for insert
with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "cases in org" on public.consultation_cases;
create policy "cases in org" on public.consultation_cases for all
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

drop policy if exists "case history via case" on public.consultation_history;
create policy "case history via case" on public.consultation_history for all
using (exists (
  select 1 from public.consultation_cases c
  where c.id = case_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
))
with check (exists (
  select 1 from public.consultation_cases c
  where c.id = case_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
));

drop policy if exists "case attachments via case" on public.consultation_attachments;
create policy "case attachments via case" on public.consultation_attachments for all
using (exists (
  select 1 from public.consultation_cases c
  where c.id = case_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
))
with check (exists (
  select 1 from public.consultation_cases c
  where c.id = case_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
));

drop policy if exists "checklists in org" on public.checklists;
create policy "checklists in org" on public.checklists for select
using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));

drop policy if exists "manage checklists by admin" on public.checklists;
create policy "manage checklists by admin" on public.checklists for all
using (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "checklist items via checklist" on public.checklist_items;
create policy "checklist items via checklist" on public.checklist_items for select
using (exists (
  select 1 from public.checklists c
  where c.id = checklist_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('super_admin'))
));

drop policy if exists "faq in org" on public.faq_items;
create policy "faq in org" on public.faq_items for select
using (organization_id = public.current_user_org_id() or is_published = true or public.has_role('super_admin'));

drop policy if exists "prompt templates read admin" on public.prompt_templates;
create policy "prompt templates read admin" on public.prompt_templates for select
using ((organization_id = public.current_user_org_id() and public.has_role('admin')) or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "settings read admin" on public.system_settings;
create policy "settings read admin" on public.system_settings for select
using ((organization_id = public.current_user_org_id() and public.has_role('admin')) or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "notifications in org" on public.update_notifications;
create policy "notifications in org" on public.update_notifications for select
using (organization_id = public.current_user_org_id() or public.has_role('super_admin'));

drop policy if exists "analytics admin read" on public.analytics_events;
create policy "analytics admin read" on public.analytics_events for select
using (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "question log access events insert admin only" on public.question_log_access_events;
create policy "question log access events insert admin only" on public.question_log_access_events for insert
with check (viewer_id = auth.uid() and public.can_read_question_log_detail_admin());

drop policy if exists "question log access events admin read" on public.question_log_access_events;
create policy "question log access events admin read" on public.question_log_access_events for select
using (public.can_read_question_log_detail_admin());

drop policy if exists "masking settings admin" on public.masking_settings;
create policy "masking settings admin" on public.masking_settings for all
using (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
with check (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')));

drop policy if exists "own answer feedback" on public.answer_feedback;
create policy "own answer feedback" on public.answer_feedback for all
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'))
with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin'));

drop policy if exists "question examples in org" on public.question_examples;
create policy "question examples in org" on public.question_examples for select
using (organization_id = public.current_user_org_id() or organization_id is null or public.has_role('super_admin'));
