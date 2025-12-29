import { Worker } from "bullmq";
import { redis } from "../redis.ts";
import { minio, ensureBucket } from "../storage/minio.ts";
const BUCKET = "download-results";
await ensureBucket(BUCKET);

const worker = new Worker(
    "download-queue",
    async (job) => {
        const { fileIds } = job.data;

        console.log(
            `[Worker] Started job ${job.id} for files: ${fileIds.join(", ")}`
        );

        await redis.hset(`job:${job.id}`, {
            status: "processing",
            updatedAt: Date.now(),
        });

        try {
            // Simulate long-running work



            const delayMs =
                Number(process.env.DOWNLOAD_DELAY_MIN_MS ?? 10000) +
                Math.floor(
                    Math.random() *
                    (Number(process.env.DOWNLOAD_DELAY_MAX_MS ?? 20000) -
                        Number(process.env.DOWNLOAD_DELAY_MIN_MS ?? 10000))
                );

            await new Promise((resolve) => setTimeout(resolve, delayMs));
            // Generate fake result file
            const content = `Job ${job.id} completed at ${new Date().toISOString()}`;
            const buffer = Buffer.from(content);

            const objectName = `results/job-${job.id}.txt`;

            // Upload to MinIO
            await minio.putObject(
                BUCKET,
                objectName,
                buffer,
                buffer.length,
                {
                    "Content-Type": "text/plain",
                }
            );
            await redis.hset(`job:${job.id}`, {
                status: "completed",
                processedFiles: fileIds.length,
                bucket: BUCKET,
                resultKey: objectName,
                updatedAt: Date.now(),
            });

            

            await redis.expire(`job:${job.id}`, 86400);
            console.log(
                `[Worker] Finished job ${job.id} after ${(delayMs / 1000).toFixed(1)}s`
            );

            return {
                processedFiles: fileIds.length,
                processingTimeMs: delayMs,
            };
        } catch (err) {
            const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

            await redis.hset(`job:${job.id}`, {
                status: isLastAttempt ? "failed" : "retrying",
                error: (err as Error).message,
                updatedAt: Date.now(),
            });
            if (isLastAttempt) {
                await redis.expire(`job:${job.id}`, 86400);
            }

            throw err;
        }


        // IMPORTANT: rethrow so BullMQ knows this job failed

    },
    {
        connection: {
            host: process.env.REDIS_HOST ?? "localhost",
            port: Number(process.env.REDIS_PORT ?? 6379),
        },
        lockDuration: 60000,
    }
);

console.log("[Worker] Download worker started");
