import { Client } from "minio";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
const MINIO_PORT = Number(process.env.MINIO_PORT ?? 9000);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;

if (!MINIO_ENDPOINT) {
  throw new Error("MINIO_ENDPOINT is required");
}

if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
  throw new Error("MINIO credentials are required");
}

export const minio = new Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: false,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
  region: "us-east-1",
  pathStyle: true,
});

export const ensureBucket = async (bucket: string) => {
  const exists = await minio.bucketExists(bucket);
  if (!exists) {
    await minio.makeBucket(bucket, "us-east-1");
    console.log(`[MinIO] Bucket created: ${bucket}`);
  } else {
    console.log(`[MinIO] Bucket exists: ${bucket}`);
  }
};
