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
  typeof MINIO_ENDPOINT === "string" &&
  typeof MINIO_ACCESS_KEY === "string" &&
  typeof MINIO_SECRET_KEY === "string";

let minioClient: Client | null = null;

if (isMinioEnabled) {
  // Values are now strongly typed as string
  const endPoint = MINIO_ENDPOINT;
  const accessKey = MINIO_ACCESS_KEY;
  const secretKey = MINIO_SECRET_KEY;

  minioClient = new Client({
    endPoint,
    port: MINIO_PORT,
    useSSL: false,
    accessKey,
    secretKey,
    region: "us-east-1",
    pathStyle: true,
  });
} else {
  console.warn("[MinIO] Disabled (missing env variables)");
}

export const minio = minioClient;

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
