import IORedis from "ioredis";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const redis = new IORedis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
});
