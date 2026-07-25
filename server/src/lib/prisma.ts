import { Prisma, PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

export const prisma = new PrismaClient({
  log:
    env.NODE_ENV === "development"
      ? [{ emit: "event", level: "error" }]
      : [{ emit: "event", level: "error" }],
});

prisma.$on("error", (event: Prisma.LogEvent) => {
  logger.error({ target: event.target }, "Database error");
});
