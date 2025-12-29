import IORedis from "ioredis";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const redis = new IORedis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
        if (times > 3) {
            console.error("[Redis] Max retries reached, giving up");
            return null; // stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

// Handle Redis connection errors gracefully
redis.on("error", (err: Error) => {
    console.error("[Redis] Connection error:", err.message);
});

redis.on("connect", () => {
    console.log("[Redis] Connected successfully");
});

redis.on("ready", () => {
    console.log("[Redis] Ready to accept commands");
});
