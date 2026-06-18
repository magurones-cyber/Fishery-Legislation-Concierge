alter table public.organizations
  add column if not exists parent_id uuid references public.organizations(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

create table if not exists public.user_organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_in_organization text not null,
  created_at timestamptz not null default now(),
  unique (user_id, organization_id, role_in_organization)
);

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  terms_version text not null,
  privacy_policy_version text not null,
  log_analysis_consent boolean not null default false,
  consented_at timestamptz,
  ip_address inet,
  user_agent text,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  event_type text not null,
  category_id uuid references public.categories(id) on delete set null,
  target_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.terms_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  document_type text not null,
  body text not null,
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (version, document_type)
);

alter table public.qa_sessions
  add column if not exists visibility text not null default 'private',
  add column if not exists consent_version text,
  add column if not exists contains_personal_data boolean not null default false,
  add column if not exists anonymized_for_analytics boolean not null default false,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists confidence_level text,
  add column if not exists missing_sources jsonb not null default '[]'::jsonb,
  add column if not exists feedback text;

alter table public.qa_messages
  add column if not exists raw_text text,
  add column if not exists masked_text text,
  add column if not exists ai_sent_text text,
  add column if not exists contains_personal_data boolean not null default false;

alter table public.audit_logs
  add column if not exists target_user_id uuid references public.users(id) on delete set null,
  add column if not exists target_organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists reason text,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb;

create index if not exists user_consents_user_idx on public.user_consents(user_id, created_at desc);
create index if not exists analytics_events_org_type_idx on public.analytics_events(organization_id, event_type, created_at desc);
create index if not exists qa_sessions_org_category_idx on public.qa_sessions(organization_id, category_id, created_at desc);
create index if not exists qa_sessions_confidence_idx on public.qa_sessions(confidence_level);

alter table public.user_organizations enable row level security;
alter table public.user_consents enable row level security;
alter table public.analytics_events enable row level security;
alter table public.terms_versions enable row level security;

drop policy if exists "own user organizations" on public.user_organizations;
create policy "own user organizations" on public.user_organizations
for select
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('super_admin'));

drop policy if exists "own consents" on public.user_consents;
create policy "own consents" on public.user_consents
for all
using (user_id = auth.uid() or public.has_role('admin') or public.has_role('super_admin'))
with check (user_id = auth.uid() or public.has_role('admin') or public.has_role('super_admin'));

drop policy if exists "analytics admin read" on public.analytics_events;
create policy "analytics admin read" on public.analytics_events
for select
using (public.has_role('admin') or public.has_role('super_admin'));

drop policy if exists "terms public read" on public.terms_versions;
create policy "terms public read" on public.terms_versions
for select
using (true);

insert into public.roles (name, description) values
  ('general_user', '一般利用者'),
  ('fisheries_coop_staff', '漁協職員'),
  ('fisheries_coop_manager', '漁協管理者'),
  ('municipality_staff', '自治体職員'),
  ('municipality_manager', '自治体管理者'),
  ('system_admin', 'システム管理者')
on conflict (name) do update set description = excluded.description;

insert into public.terms_versions (version, document_type, body)
values
  ('2026-06-14', 'terms', '質問、AI回答、参照資料、利用日時、カテゴリ、評価、添付資料を保存し、管理者が利用目的の範囲内で閲覧・分析することがあります。'),
  ('2026-06-14', 'privacy', '質問ログは業務改善、FAQ改善、研修テーマ抽出、支援ニーズ把握、資料追加のために利用します。分析画面では個人情報をマスキングします。')
on conflict (version, document_type) do nothing;

insert into public.prompt_templates (organization_id, name, template, version, is_active) values
  ('00000000-0000-0000-0000-000000000000', 'document_yugyosen_registration_memo', '遊漁船業者登録相談メモを、登録要否、必要書類、主任者、保険、業務規程、安全管理、漁場利用調整に分けて作成する。', 1, true),
  ('00000000-0000-0000-0000-000000000000', 'document_question_log_analysis_report', '質問ログ分析レポートを、カテゴリ別傾向、不足資料、FAQ候補、研修テーマ候補、支援施策改善案に分けて作成する。', 1, true),
  ('00000000-0000-0000-0000-000000000000', 'document_yugyosen_safety_checksheet', '遊漁船安全管理チェックシートを、出航判断、気象海象、利用者名簿、安全説明、事故報告、保険、主任者体制に分けて作成する。', 1, true)
on conflict (organization_id, name, version) do nothing;
