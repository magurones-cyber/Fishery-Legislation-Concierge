insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

alter table public.consultation_cases
  add column if not exists case_number text,
  add column if not exists consulted_at date,
  add column if not exists consultation_category text,
  add column if not exists requester text,
  add column if not exists district text,
  add column if not exists municipality text,
  add column if not exists coop_name text,
  add column if not exists fishing_port text,
  add column if not exists species text,
  add column if not exists fishery_type text,
  add column if not exists consultation_content text,
  add column if not exists ai_answer text,
  add column if not exists source_summary jsonb not null default '[]'::jsonb,
  add column if not exists assignee_name text,
  add column if not exists status_label text not null default '未対応',
  add column if not exists next_action_date date,
  add column if not exists due_date date,
  add column if not exists stakeholders text,
  add column if not exists internal_memo text,
  add column if not exists attachment_summary jsonb not null default '[]'::jsonb,
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.consultation_history
  add column if not exists handled_at timestamptz not null default now(),
  add column if not exists handler_name text,
  add column if not exists response_type text not null default 'その他',
  add column if not exists next_action text,
  add column if not exists visibility text not null default '漁協職員以上',
  add column if not exists attachment_summary jsonb not null default '[]'::jsonb;

create table if not exists public.case_checklists (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.consultation_cases(id) on delete cascade,
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  assigned_to uuid references public.users(id) on delete set null,
  status text not null default 'in_progress',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, checklist_id)
);

create table if not exists public.case_checklist_items (
  id uuid primary key default gen_random_uuid(),
  case_checklist_id uuid not null references public.case_checklists(id) on delete cascade,
  checklist_item_id uuid references public.checklist_items(id) on delete set null,
  label text not null,
  is_checked boolean not null default false,
  checked_by uuid references public.users(id) on delete set null,
  checked_at timestamptz,
  note text,
  sort_order integer not null default 0
);

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  case_id uuid references public.consultation_cases(id) on delete set null,
  qa_session_id uuid references public.qa_sessions(id) on delete set null,
  document_type text not null,
  title text not null,
  markdown_content text not null,
  source_summary jsonb not null default '[]'::jsonb,
  export_format text not null default 'markdown',
  visibility text not null default '漁協職員以上',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.favorites
  add column if not exists faq_item_id uuid references public.faq_items(id) on delete cascade,
  add column if not exists checklist_id uuid references public.checklists(id) on delete cascade,
  add column if not exists generated_document_id uuid references public.generated_documents(id) on delete cascade,
  add column if not exists chunk_id uuid references public.document_chunks(id) on delete cascade;

alter table public.favorites drop constraint if exists favorites_check;
alter table public.favorites
  add constraint favorites_exactly_one_target check (
    (document_id is not null)::integer
    + (qa_session_id is not null)::integer
    + (case_id is not null)::integer
    + (faq_item_id is not null)::integer
    + (checklist_id is not null)::integer
    + (generated_document_id is not null)::integer
    + (chunk_id is not null)::integer = 1
  );

create index if not exists consultation_cases_org_status_due_idx on public.consultation_cases(organization_id, status_label, due_date);
create index if not exists consultation_cases_number_idx on public.consultation_cases(organization_id, case_number);
create index if not exists consultation_cases_category_idx on public.consultation_cases(organization_id, consultation_category);
create index if not exists consultation_history_case_time_idx on public.consultation_history(case_id, handled_at desc);
create index if not exists case_checklists_case_idx on public.case_checklists(case_id);
create index if not exists case_checklist_items_parent_idx on public.case_checklist_items(case_checklist_id, sort_order);
create index if not exists generated_documents_case_idx on public.generated_documents(case_id, created_at desc);
create index if not exists favorites_user_targets_idx on public.favorites(user_id, created_at desc);

alter table public.case_checklists enable row level security;
alter table public.case_checklist_items enable row level security;
alter table public.generated_documents enable row level security;

drop policy if exists "case checklists via case" on public.case_checklists;
create policy "case checklists via case" on public.case_checklists
for all
using (exists (
  select 1 from public.consultation_cases c
  where c.id = case_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('super_admin') or public.has_role('system_admin'))
))
with check (exists (
  select 1 from public.consultation_cases c
  where c.id = case_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('super_admin') or public.has_role('system_admin'))
));

drop policy if exists "case checklist items via parent" on public.case_checklist_items;
create policy "case checklist items via parent" on public.case_checklist_items
for all
using (exists (
  select 1
  from public.case_checklists cc
  join public.consultation_cases c on c.id = cc.case_id
  where cc.id = case_checklist_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('super_admin') or public.has_role('system_admin'))
))
with check (exists (
  select 1
  from public.case_checklists cc
  join public.consultation_cases c on c.id = cc.case_id
  where cc.id = case_checklist_id
    and (c.organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('super_admin') or public.has_role('system_admin'))
));

drop policy if exists "generated documents in org" on public.generated_documents;
create policy "generated documents in org" on public.generated_documents
for all
using (organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('super_admin') or public.has_role('system_admin'))
with check (organization_id = public.current_user_org_id() or public.has_role('admin') or public.has_role('super_admin') or public.has_role('system_admin'));

drop policy if exists "manage checklists by admin" on public.checklists;
create policy "manage checklists by admin" on public.checklists
for all
using (public.has_role('admin') or public.has_role('super_admin') or public.has_role('system_admin'))
with check (public.has_role('admin') or public.has_role('super_admin') or public.has_role('system_admin'));

drop policy if exists "manage checklist items by admin" on public.checklist_items;
create policy "manage checklist items by admin" on public.checklist_items
for all
using (public.has_role('admin') or public.has_role('super_admin') or public.has_role('system_admin'))
with check (public.has_role('admin') or public.has_role('super_admin') or public.has_role('system_admin'));

insert into public.roles (name, description) values
  ('general_user', '一般利用者: 公開資料の検索、質問、お気に入り'),
  ('fisheries_coop_staff', '漁協職員: 相談記録、漁業者指導記録'),
  ('municipality_staff', '自治体職員: 漁協指導記録、内部メモ、案件管理'),
  ('admin', '管理者: 資料登録、更新、カテゴリ管理、ユーザー管理'),
  ('system_admin', 'システム管理者: 全権限、ログ、設定')
on conflict (name) do update set description = excluded.description;

insert into public.prompt_templates (organization_id, name, template, version, is_active) values
  ('00000000-0000-0000-0000-000000000000', 'phase2_fisher_explanation', '案件情報と根拠資料をもとに、漁業者向け説明文を専門用語の補足付きで作成する。根拠がない事項は要確認とする。', 1, true),
  ('00000000-0000-0000-0000-000000000000', 'phase2_coop_guidance_memo', '漁協向け指導メモを、定款、理事会、総会、組合員資格、員外利用、会計処理、説明責任に分けて作成する。', 1, true),
  ('00000000-0000-0000-0000-000000000000', 'phase2_internal_consultation_memo', '庁内協議メモを、事実関係、根拠、論点、所管確認、行政リスク、次回対応に分けて作成する。', 1, true),
  ('00000000-0000-0000-0000-000000000000', 'phase2_subsidy_review_memo', '補助金審査メモを、対象経費、証憑、按分、消費税、財産処分、実績報告、返還リスクに分けて作成する。', 1, true)
on conflict (organization_id, name, version) do nothing;
