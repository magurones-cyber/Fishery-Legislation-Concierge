import type { SignedUrlInput, StorageAdapter, StorageProvider, UploadObjectInput } from "./types";

export class ExternalStorageAdapter implements StorageAdapter {
  constructor(readonly provider: Exclude<StorageProvider, "supabase">) {}

  async upload(input: UploadObjectInput): Promise<never> {
    void input;
    throw new Error(`${this.provider} storage is not configured. Add provider credentials and implementation before production use.`);
  }

  async getSignedUrl(input: SignedUrlInput): Promise<never> {
    void input;
    throw new Error(`${this.provider} signed URL is not configured.`);
  }

  async remove(input: { bucket: string; path: string }): Promise<never> {
    void input;
    throw new Error(`${this.provider} object removal is not configured.`);
  }
}
