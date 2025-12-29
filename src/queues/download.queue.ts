import { Queue } from "bullmq";

export const downloadQueue = new Queue("download-queue", {
  connection: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
});
