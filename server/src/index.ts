import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { connectRedis, disconnectRedis } from "./lib/redis.js";
import { initSocketServer } from "./lib/socket.js";

async function main() {
  await connectRedis();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Server listening");
  });

  initSocketServer(server);

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down");
    server.close();
    await disconnectRedis();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.fatal({ err: error }, "Failed to start server");
  process.exit(1);
});
