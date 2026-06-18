-- WARNING:
-- This file is for local development or empty Supabase projects only.
-- Do not run this against production or any database containing real data.
-- It removes application tables and functions so that manual setup SQL can be tested again.

drop policy if exists "storage objects no public read" on storage.objects;

drop function if exists public.record_question_log_access(uuid, text, jsonb);
drop function if exists public.can_read_question_log_detail_admin();
drop function if exists public.can_read_question_log_summary(uuid, uuid);
drop function if exists public.can_read_document_visibility(public.document_visibility);
drop function if exists public.hybrid_search_document_chunks(text, vector(1536), uuid, text[], uuid, text[], text, text, text, integer);
drop function if exists public.hybrid_search_document_chunks(text, vector(3072), uuid, text[], uuid, text[], text, text, text, integer);
drop function if exists public.match_documents(vector(1536), integer, uuid, text[]);
drop function if exists public.match_documents(vector(3072), integer, uuid, text[]);
drop function if exists public.has_role(text);
drop function if exists public.current_user_org_id();

drop table if exists public.question_log_access_events cascade;
drop table if exists public.answer_feedback cascade;
drop table if exists public.masking_settings cascade;
drop table if exists public.analytics_events cascade;
drop table if exists public.user_consents cascade;
drop table if exists public.terms_versions cascade;
drop table if exists public.favorites cascade;
drop table if exists public.qa_sources cascade;
drop table if exists public.qa_messages cascade;
drop table if exists public.qa_sessions cascade;
drop table if exists public.consultation_attachments cascade;
drop table if exists public.consultation_history cascade;
drop table if exists public.consultation_cases cascade;
drop table if exists public.document_tags cascade;
drop table if exists public.document_chunks cascade;
drop table if exists public.document_versions cascade;
drop table if exists public.documents cascade;
drop table if exists public.question_examples cascade;
drop table if exists public.update_notifications cascade;
drop table if exists public.faq_items cascade;
drop table if exists public.prompt_templates cascade;
drop table if exists public.system_settings cascade;
drop table if exists public.checklist_items cascade;
drop table if exists public.checklists cascade;
drop table if exists public.tags cascade;
drop table if exists public.categories cascade;
drop table if exists public.user_organizations cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.users cascade;
drop table if exists public.roles cascade;
drop table if exists public.organizations cascade;
drop table if exists public.audit_logs cascade;

drop type if exists public.message_role cascade;
drop type if exists public.case_status cascade;
drop type if exists public.document_processing_status cascade;
drop type if exists public.document_visibility cascade;
drop type if exists public.document_source_type cascade;
