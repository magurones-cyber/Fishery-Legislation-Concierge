export type StorageProvider = "supabase" | "s3" | "r2" | "b2";

export type StoredObject = {
  provider: StorageProvider;
  bucket: string;
  path: string;
  contentType?: string;
  size?: number;
};

export type UploadObjectInput = {
  bucket: string;
  path: string;
  file: Blob;
  contentType?: string;
  upsert?: boolean;
};

export type SignedUrlInput = {
  bucket: string;
  path: string;
  expiresInSeconds?: number;
};

export type RemoveObjectInput = {
  bucket: string;
  path: string;
};

export type StorageAdapter = {
  provider: StorageProvider;
  upload(input: UploadObjectInput): Promise<StoredObject>;
  getSignedUrl(input: SignedUrlInput): Promise<string>;
  remove(input: RemoveObjectInput): Promise<void>;
};

export type SupabaseStorageClientLike = {
  storage: {
    from(bucket: string): {
      upload(path: string, file: Blob, options?: { contentType?: string; upsert?: boolean }): Promise<{
        data: { path?: string; fullPath?: string } | null;
        error: { message: string } | null;
      }>;
      createSignedUrl(path: string, expiresIn: number): Promise<{
        data: { signedUrl: string } | null;
        error: { message: string } | null;
      }>;
      remove(paths: string[]): Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    };
  };
};
