-- 07_storage_notes.sql
-- Supabase Storage bucketの初期設定です。bucketはprivateを基本にします。

insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('attachments', 'attachments', false),
  ('archives', 'archives', false),
  ('backups', 'backups', false),
  ('consultation-attachments', 'consultation-attachments', false),
  ('generated', 'generated', false)
on conflict (id) do update
set public = false;

-- PDFや添付画像は公開URLではなく、アプリ側で権限確認後に署名付きURLを発行してください。
-- Storage object policyは運用ロール、bucket構成、外部Storage利用有無に応じて調整してください。

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
