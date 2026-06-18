import type { SignedUrlInput, StorageAdapter, StoredObject, SupabaseStorageClientLike, UploadObjectInput } from "./types";

export class SupabaseStorageAdapter implements StorageAdapter {
  readonly provider = "supabase" as const;

  constructor(private readonly supabase: SupabaseStorageClientLike) {}

  async upload(input: UploadObjectInput): Promise<StoredObject> {
    const { data, error } = await this.supabase.storage.from(input.bucket).upload(input.path, input.file, {
      contentType: input.contentType,
      upsert: input.upsert ?? false
    });
    if (error) throw new Error(error.message);

    return {
      provider: this.provider,
      bucket: input.bucket,
      path: data?.path ?? input.path,
      contentType: input.contentType,
      size: input.file.size
    };
  }

  async getSignedUrl(input: SignedUrlInput): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(input.bucket)
      .createSignedUrl(input.path, input.expiresInSeconds ?? 60 * 10);
    if (error || !data?.signedUrl) throw new Error(error?.message ?? "署名付きURLを作成できませんでした。");
    return data.signedUrl;
  }

  async remove(input: { bucket: string; path: string }): Promise<void> {
    const { error } = await this.supabase.storage.from(input.bucket).remove([input.path]);
    if (error) throw new Error(error.message);
  }
}
