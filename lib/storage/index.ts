import { ExternalStorageAdapter } from "./external-storage";
import { SupabaseStorageAdapter } from "./supabase-storage";
import type { StorageAdapter, StorageProvider, SupabaseStorageClientLike } from "./types";

export type CreateStorageAdapterInput = {
  provider?: StorageProvider;
  supabase?: SupabaseStorageClientLike;
};

export function createStorageAdapter(input: CreateStorageAdapterInput = {}): StorageAdapter {
  const provider = input.provider ?? readProvider(process.env.STORAGE_PROVIDER) ?? "supabase";

  if (provider === "supabase") {
    if (!input.supabase) throw new Error("Supabase client is required for Supabase Storage.");
    return new SupabaseStorageAdapter(input.supabase);
  }

  return new ExternalStorageAdapter(provider);
}

export function getDocumentBucket() {
  return process.env.DOCUMENT_BUCKET ?? "documents";
}

export function getAttachmentBucket() {
  return process.env.ATTACHMENT_BUCKET ?? "attachments";
}

export function getArchiveBucket() {
  return process.env.ARCHIVE_BUCKET ?? "archives";
}

export function getBackupBucket() {
  return process.env.BACKUP_BUCKET ?? "backups";
}

function readProvider(value: string | undefined): StorageProvider | null {
  if (value === "supabase" || value === "s3" || value === "r2" || value === "b2") return value;
  return null;
}

export type { StorageAdapter, StorageProvider, StoredObject } from "./types";
