-- 08_auth_connection.sql
-- Supabase Auth本接続後に実行します。既存データを削除せず再実行できます。

alter table public.qa_sessions
  add column if not exists status text not null default 'active';

create index if not exists user_consents_current_idx
  on public.user_consents(user_id, terms_version, privacy_policy_version, consented_at desc)
  where consented = true and revoked_at is null;

create or replace function public.bootstrap_auth_user(
  target_user_id uuid,
  target_organization_id uuid,
  target_role_name text,
  target_display_name text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  auth_email text;
  target_role_id uuid;
begin
  if target_role_name not in ('admin', 'system_admin', 'super_admin') then
    raise exception 'bootstrap role must be admin, system_admin, or super_admin';
  end if;

  select email into auth_email from auth.users where id = target_user_id;
  if auth_email is null then
    raise exception 'auth user not found';
  end if;

  if not exists (select 1 from public.organizations where id = target_organization_id) then
    raise exception 'organization not found';
  end if;

  select id into target_role_id from public.roles where name = target_role_name;
  if target_role_id is null then
    raise exception 'role not found';
  end if;

  insert into public.users (id, organization_id, display_name, email, is_active)
  values (target_user_id, target_organization_id, coalesce(nullif(target_display_name, ''), auth_email), auth_email, true)
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    display_name = excluded.display_name,
    email = excluded.email,
    is_active = true,
    updated_at = now();

  insert into public.user_organizations (user_id, organization_id, role_in_organization)
  values (target_user_id, target_organization_id, target_role_name)
  on conflict (user_id, organization_id, role_in_organization) do nothing;

  insert into public.user_roles (user_id, role_id, organization_id)
  values (target_user_id, target_role_id, target_organization_id)
  on conflict (user_id, role_id) do update set organization_id = excluded.organization_id;
end;
$$;

revoke all on function public.bootstrap_auth_user(uuid, uuid, text, text) from public, anon, authenticated;

comment on function public.bootstrap_auth_user(uuid, uuid, text, text) is
  'SQL Editorから初期管理者のauth.usersとpublic.users・所属・ロールを紐付ける。アプリ利用者からは実行不可。';
