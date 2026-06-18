insert into public.organizations (id, name, organization_type, prefecture)
values ('00000000-0000-0000-0000-000000000000', 'デフォルト組織', 'system', '未設定')
on conflict (id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  prefecture = excluded.prefecture;

drop policy if exists "read document versions in org" on public.document_versions;
drop policy if exists "read document versions by document visibility" on public.document_versions;
create policy "read document versions by document visibility" on public.document_versions
for select
using (exists (
  select 1
  from public.documents d
  where d.id = document_id
    and coalesce(d.deleted_at is null, true)
    and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))
    and (
      d.visibility = 'public'
      or (d.visibility = 'fisheries_coop_staff' and (public.has_role('fisheries_coop_staff') or public.has_role('municipality_staff') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
      or (d.visibility = 'municipality_staff' and (public.has_role('municipality_staff') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
      or (d.visibility = 'admin_only' and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
    )
));

drop policy if exists "read document chunks in org" on public.document_chunks;
drop policy if exists "read document chunks by document visibility" on public.document_chunks;
create policy "read document chunks by document visibility" on public.document_chunks
for select
using (exists (
  select 1
  from public.documents d
  where d.id = document_id
    and coalesce(d.deleted_at is null, true)
    and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))
    and (
      d.visibility = 'public'
      or (d.visibility = 'fisheries_coop_staff' and (public.has_role('fisheries_coop_staff') or public.has_role('municipality_staff') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
      or (d.visibility = 'municipality_staff' and (public.has_role('municipality_staff') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
      or (d.visibility = 'admin_only' and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
    )
));

drop policy if exists "read document tags via document" on public.document_tags;
drop policy if exists "read document tags by document visibility" on public.document_tags;
create policy "read document tags by document visibility" on public.document_tags
for select
using (exists (
  select 1
  from public.documents d
  where d.id = document_id
    and coalesce(d.deleted_at is null, true)
    and (d.organization_id = public.current_user_org_id() or public.has_role('super_admin'))
    and (
      d.visibility = 'public'
      or (d.visibility = 'fisheries_coop_staff' and (public.has_role('fisheries_coop_staff') or public.has_role('municipality_staff') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
      or (d.visibility = 'municipality_staff' and (public.has_role('municipality_staff') or public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
      or (d.visibility = 'admin_only' and (public.has_role('admin') or public.has_role('system_admin') or public.has_role('super_admin')))
    )
));

insert into public.system_settings (organization_id, key, value)
values (
  '00000000-0000-0000-0000-000000000000',
  'release_readiness',
  '{"phase":"5","admin_upload_token_required_in_production":true,"direct_chunk_rls_hardened":true}'::jsonb
)
on conflict (organization_id, key) do update set value = excluded.value, updated_at = now();
