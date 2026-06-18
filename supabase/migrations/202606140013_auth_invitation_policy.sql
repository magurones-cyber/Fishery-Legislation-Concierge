-- Supabase Authは運営者が作成したProjectを利用し、アプリ利用者は管理者招待制とする。

insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

create table if not exists public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  display_name text not null,
  role_name text not null,
  invited_user_id uuid references public.users(id) on delete set null,
  invited_by uuid references public.users(id) on delete set null,
  status text not null default 'invited' check (status in ('invited', 'accepted', 'revoked', 'expired')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (organization_id, email)
);

create index if not exists user_invitations_org_status_idx on public.user_invitations(organization_id, status, invited_at desc);

alter table public.user_invitations enable row level security;

drop policy if exists "user invitations admin only" on public.user_invitations;
create policy "user invitations admin only"
on public.user_invitations
for all
using (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
with check (organization_id = public.current_user_org_id() and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')));

insert into public.system_settings (organization_id, key, value, description)
select id, 'auth_policy',
  '{"supabase_project_created_by_operator": true, "free_signup": false, "invitation_required": true, "login_methods": ["password", "magic_link"], "initial_consent_required": true}'::jsonb,
  'Supabase Projectは運営者が作成し、アプリ利用者は管理者招待制で作成する。'
from public.organizations
on conflict do nothing;
