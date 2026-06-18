-- 04_qa_logs_analytics_schema.sql
-- 質問ログ、案件管理、監査、同意、分析、Phase 4運用テーブルを作成します。

create table if not exists public.qa_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  title text,
  visibility text not null default 'private',
  consent_version text,
  contains_personal_data boolean not null default false,
  anonymized_for_analytics boolean not null default false,
  category_id uuid references public.categories(id) on delete set null,
  confidence_level text,
  missing_sources jsonb not null default '[]'::jsonb,
  feedback text,
  user_organization_id uuid references public.organizations(id) on delete set null,
  user_department text,
  user_role_snapshot text,
  answer_rating text,
  individual_log_access_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.qa_sessions
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists user_id uuid references public.users(id) on delete set null,
  add column if not exists title text,
  add column if not exists visibility text not null default 'private',
  add column if not exists consent_version text,
  add column if not exists contains_personal_data boolean not null default false,
  add column if not exists anonymized_for_analytics boolean not null default false,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists confidence_level text,
  add column if not exists missing_sources jsonb not null default '[]'::jsonb,
  add column if not exists feedback text,
  add column if not exists user_organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists user_department text,
  add column if not exists user_role_snapshot text,
  add column if not exists answer_rating text,
  add column if not exists individual_log_access_count integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.qa_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.qa_sessions(id) on delete cascade,
  role public.message_role not null,
  content text not null,
  raw_text text,
  masked_text text,
  ai_sent_text text,
  contains_personal_data boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.qa_messages
  add column if not exists session_id uuid references public.qa_sessions(id) on delete cascade,
  add column if not exists role public.message_role,
  add column if not exists content text,
  add column if not exists raw_text text,
  add column if not exists masked_text text,
  add column if not exists ai_sent_text text,
  add column if not exists contains_personal_data boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.qa_sources (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.qa_messages(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  document_chunk_id uuid references public.document_chunks(id) on delete set null,
  citation_text text,
  score double precision,
  created_at timestamptz not null default now()
);

alter table public.qa_sources
  add column if not exists message_id uuid references public.qa_messages(id) on delete cascade,
  add column if not exists document_id uuid references public.documents(id) on delete set null,
  add column if not exists document_chunk_id uuid references public.document_chunks(id) on delete set null,
  add column if not exists citation_text text,
  add column if not exists score double precision,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.consultation_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  case_number text,
  title text not null,
  status public.case_status not null default 'open',
  status_label text not null default '未対応',
  consulted_at date,
  consultation_category text,
  requester text,
  requester_type text,
  district text,
  municipality text,
  coop_name text,
  fishing_port text,
  species text,
  fishery_type text,
  consultation_content text,
  ai_answer text,
  source_summary jsonb not null default '[]'::jsonb,
  assignee_name text,
  assigned_to uuid references public.users(id) on delete set null,
  next_action_date date,
  due_date date,
  stakeholders text,
  internal_memo text,
  attachment_summary jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}'::text[],
  visibility text not null default '漁協職員以上',
  related_user_ids uuid[] not null default '{}'::uuid[],
  deleted_at timestamptz,
  deleted_by uuid references public.users(id) on delete set null,
  delete_reason text,
  restored_at timestamptz,
  restored_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.consultation_cases
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists case_number text,
  add column if not exists title text,
  add column if not exists status public.case_status not null default 'open',
  add column if not exists status_label text not null default '未対応',
  add column if not exists consulted_at date,
  add column if not exists consultation_category text,
  add column if not exists requester text,
  add column if not exists requester_type text,
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
  add column if not exists assigned_to uuid references public.users(id) on delete set null,
  add column if not exists next_action_date date,
  add column if not exists due_date date,
  add column if not exists stakeholders text,
  add column if not exists internal_memo text,
  add column if not exists attachment_summary jsonb not null default '[]'::jsonb,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists visibility text not null default '漁協職員以上',
  add column if not exists related_user_ids uuid[] not null default '{}'::uuid[],
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.consultation_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.consultation_cases(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action_type text not null default 'note',
  handled_at timestamptz not null default now(),
  handler_name text,
  response_type text not null default 'その他',
  content text not null,
  next_action text,
  visibility text not null default '漁協職員以上',
  attachment_summary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.consultation_history
  add column if not exists case_id uuid references public.consultation_cases(id) on delete cascade,
  add column if not exists actor_id uuid references public.users(id) on delete set null,
  add column if not exists action_type text not null default 'note',
  add column if not exists handled_at timestamptz not null default now(),
  add column if not exists handler_name text,
  add column if not exists response_type text not null default 'その他',
  add column if not exists content text,
  add column if not exists next_action text,
  add column if not exists visibility text not null default '漁協職員以上',
  add column if not exists attachment_summary jsonb not null default '[]'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.consultation_attachments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.consultation_cases(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.consultation_attachments
  add column if not exists case_id uuid references public.consultation_cases(id) on delete cascade,
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists uploaded_by uuid references public.users(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  qa_session_id uuid references public.qa_sessions(id) on delete cascade,
  case_id uuid references public.consultation_cases(id) on delete cascade,
  faq_item_id uuid references public.faq_items(id) on delete cascade,
  checklist_id uuid references public.checklists(id) on delete cascade,
  generated_document_id uuid,
  chunk_id uuid references public.document_chunks(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.favorites
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists document_id uuid references public.documents(id) on delete cascade,
  add column if not exists qa_session_id uuid references public.qa_sessions(id) on delete cascade,
  add column if not exists case_id uuid references public.consultation_cases(id) on delete cascade,
  add column if not exists faq_item_id uuid references public.faq_items(id) on delete cascade,
  add column if not exists checklist_id uuid references public.checklists(id) on delete cascade,
  add column if not exists generated_document_id uuid,
  add column if not exists chunk_id uuid references public.document_chunks(id) on delete cascade,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  target_user_id uuid references public.users(id) on delete set null,
  target_organization_id uuid references public.organizations(id) on delete set null,
  target_document_id uuid references public.documents(id) on delete set null,
  target_case_id uuid references public.consultation_cases(id) on delete set null,
  reason text,
  ip_address inet,
  result text not null default 'success',
  masked_payload_hash text,
  metadata_json jsonb not null default '{}'::jsonb,
  search_started_at timestamptz,
  search_ended_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.audit_logs
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists actor_id uuid references public.users(id) on delete set null,
  add column if not exists action text,
  add column if not exists target_table text,
  add column if not exists target_id uuid,
  add column if not exists target_user_id uuid references public.users(id) on delete set null,
  add column if not exists target_organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists target_document_id uuid references public.documents(id) on delete set null,
  add column if not exists target_case_id uuid references public.consultation_cases(id) on delete set null,
  add column if not exists reason text,
  add column if not exists ip_address inet,
  add column if not exists result text not null default 'success',
  add column if not exists masked_payload_hash text,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  terms_version text not null,
  privacy_policy_version text not null,
  log_analysis_consent boolean not null default false,
  consent_type text not null default 'terms',
  consented boolean not null default true,
  consented_at timestamptz,
  ip_address inet,
  user_agent text,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_consents
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists terms_version text,
  add column if not exists privacy_policy_version text,
  add column if not exists log_analysis_consent boolean not null default false,
  add column if not exists consent_type text not null default 'terms',
  add column if not exists consented boolean not null default true,
  add column if not exists consented_at timestamptz,
  add column if not exists ip_address inet,
  add column if not exists user_agent text,
  add column if not exists revoked_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

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

alter table public.analytics_events
  add column if not exists user_id uuid references public.users(id) on delete set null,
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists event_type text,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists target_id uuid,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.question_log_access_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  qa_session_id uuid not null references public.qa_sessions(id) on delete cascade,
  viewer_id uuid references public.users(id) on delete set null,
  viewer_role text,
  reason text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.question_log_access_events
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists qa_session_id uuid references public.qa_sessions(id) on delete cascade,
  add column if not exists viewer_id uuid references public.users(id) on delete set null,
  add column if not exists viewer_role text,
  add column if not exists reason text,
  add column if not exists detail jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.terms_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  document_type text not null,
  body text not null,
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (version, document_type)
);

alter table public.terms_versions
  add column if not exists version text,
  add column if not exists document_type text,
  add column if not exists body text,
  add column if not exists effective_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

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

alter table public.masking_settings
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists key text,
  add column if not exists label text,
  add column if not exists pattern text,
  add column if not exists replacement text,
  add column if not exists is_enabled boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

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

alter table public.answer_feedback
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists qa_session_id uuid references public.qa_sessions(id) on delete cascade,
  add column if not exists qa_message_id uuid references public.qa_messages(id) on delete cascade,
  add column if not exists user_id uuid references public.users(id) on delete set null,
  add column if not exists rating text,
  add column if not exists correction_reason text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists qa_sessions_user_idx on public.qa_sessions(user_id);
create index if not exists qa_sessions_org_category_idx on public.qa_sessions(organization_id, category_id, created_at desc);
create index if not exists qa_sessions_confidence_idx on public.qa_sessions(confidence_level);
create index if not exists qa_sessions_rating_idx on public.qa_sessions(answer_rating, created_at desc);
create index if not exists consultation_cases_org_status_idx on public.consultation_cases(organization_id, status);
create index if not exists consultation_cases_org_status_due_idx on public.consultation_cases(organization_id, status_label, due_date);
create index if not exists consultation_cases_number_idx on public.consultation_cases(organization_id, case_number);
create index if not exists consultation_history_case_time_idx on public.consultation_history(case_id, handled_at desc);
create index if not exists favorites_user_targets_idx on public.favorites(user_id, created_at desc);
create index if not exists audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);
create index if not exists audit_logs_search_idx on public.audit_logs(organization_id, action, actor_id, created_at desc);
create index if not exists user_consents_user_type_version_idx on public.user_consents(user_id, consent_type, terms_version, privacy_policy_version, created_at desc);
create index if not exists analytics_events_org_type_idx on public.analytics_events(organization_id, event_type, created_at desc);
create index if not exists question_log_access_events_session_idx on public.question_log_access_events(qa_session_id, created_at desc);
