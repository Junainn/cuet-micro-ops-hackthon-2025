import { Client } from "minio";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
const MINIO_PORT = Number(process.env.MINIO_PORT ?? 9000);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;

/**
 * MinIO is optional in CI / dev.
 * Enabled only when all required env vars exist.
 */
export const isMinioEnabled =
  Boolean(MINIO_ENDPOINT) &&
  Boolean(MINIO_ACCESS_KEY) &&
  Boolean(MINIO_SECRET_KEY);

export const minio: Client | null = isMinioEnabled
  ? new Client({
      endPoint: MINIO_ENDPOINT as string,
      port: MINIO_PORT,
      useSSL: false,
      accessKey: MINIO_ACCESS_KEY as string,
      secretKey: MINIO_SECRET_KEY as string,
      region: "us-east-1",
      pathStyle: true,
    })
  : null;

if (!isMinioEnabled) {
  console.warn("[MinIO] Disabled (missing env variables)");
}

export const ensureBucket = async (bucket: string): Promise<void> => {
  if (!minio) {
    console.warn(`[MinIO] Skipping ensureBucket for ${bucket}`);
    return;
  }

  const exists = await minio.bucketExists(bucket);
  if (!exists) {
    await minio.makeBucket(bucket, "us-east-1");
    console.log(`[MinIO] Bucket created: ${bucket}`);
  } else {
    console.log(`[MinIO] Bucket exists: ${bucket}`);
  }
};
