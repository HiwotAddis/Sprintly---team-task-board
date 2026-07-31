import type { Express } from "express";
import cors from "cors";
import express from "express";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.routes.js";
import { tasksRouter, workspacesRouter } from "./routes/workspaces.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req: { url?: string }) => req.url === "/health",
      },
    }),
  );

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "10kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/workspaces", workspacesRouter);
  app.use("/tasks", tasksRouter);

  app.use(errorHandler);

  return app;
}
