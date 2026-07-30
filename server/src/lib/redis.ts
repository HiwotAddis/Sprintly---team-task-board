import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("error", (error: Error) => {
  logger.error({ err: error }, "Redis connection error");
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
  logger.info("Redis connected");
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
