// Pluggable object-storage backend.
//
// Default: Supabase Storage (current behaviour, zero config).
// Alternatives: any S3-compatible service (AWS S3, Cloudflare R2, Backblaze
// B2, MinIO) by setting STORAGE_BACKEND=s3 and the standard S3_* env vars.
//
// Portability: switch backends with env vars only — no code change required.
// Callers import { storage } and use put / signedUrl.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PutOptions = {
  bucket: string;
  path: string;
  body: Uint8Array | Buffer;
  contentType: string;
};

export type StorageBackend = {
  put(opts: PutOptions): Promise<{ path: string }>;
  signedUrl(bucket: string, path: string, expiresInSeconds: number): Promise<string>;
};

// ---------- Supabase implementation (default) ----------
const supabaseBackend: StorageBackend = {
  async put({ bucket, path, body, contentType }) {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, body, { contentType, upsert: true });
    if (error) throw new Error(`storage.put: ${error.message}`);
    return { path };
  },
  async signedUrl(bucket, path, expiresInSeconds) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data?.signedUrl) {
      throw new Error(`storage.signedUrl: ${error?.message ?? "unknown"}`);
    }
    return data.signedUrl;
  },
};

// ---------- S3-compatible implementation (lazy) ----------
// We avoid importing @aws-sdk/* unless explicitly enabled, so the default
// Worker bundle stays small. Implement with the AWS SDK when STORAGE_BACKEND=s3.
function makeS3Backend(): StorageBackend {
  const region = process.env.S3_REGION;
  const endpoint = process.env.S3_ENDPOINT; // optional for R2/MinIO
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "STORAGE_BACKEND=s3 requires S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY (and optionally S3_ENDPOINT for R2/MinIO).",
    );
  }
  // Dynamic import via variable so TS/Vite don't try to resolve at build time.
  // Install with `bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
  // only when actually using STORAGE_BACKEND=s3.
  const loadSdk = async () => {
    const sdkName = "@aws-sdk/client-s3";
    const presignName = "@aws-sdk/s3-request-presigner";
    const [sdk, presign] = await Promise.all([
      import(/* @vite-ignore */ sdkName as string),
      import(/* @vite-ignore */ presignName as string),
    ]);
    return { sdk, presign };
  };
  return {
    async put({ bucket, path, body, contentType }) {
      const { sdk } = await loadSdk();
      const s3 = new sdk.S3Client({
        region,
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: Boolean(endpoint),
      });
      await s3.send(
        new sdk.PutObjectCommand({
          Bucket: bucket,
          Key: path,
          Body: body,
          ContentType: contentType,
        }),
      );
      return { path };
    },
    async signedUrl(bucket, path, expiresInSeconds) {
      const { sdk, presign } = await loadSdk();
      const s3 = new sdk.S3Client({
        region,
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: Boolean(endpoint),
      });
      return presign.getSignedUrl(s3, new sdk.GetObjectCommand({ Bucket: bucket, Key: path }), {
        expiresIn: expiresInSeconds,
      });
    },
  };
}

let _backend: StorageBackend | undefined;
export function getStorage(): StorageBackend {
  if (_backend) return _backend;
  const choice = (process.env.STORAGE_BACKEND ?? "supabase").toLowerCase();
  _backend = choice === "s3" ? makeS3Backend() : supabaseBackend;
  return _backend;
}

export const storage = {
  put: (opts: PutOptions) => getStorage().put(opts),
  signedUrl: (bucket: string, path: string, expiresIn = 3600) =>
    getStorage().signedUrl(bucket, path, expiresIn),
};
