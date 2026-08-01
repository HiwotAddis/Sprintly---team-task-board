import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "../utils/error-codes.js";
import { logger } from "../lib/logger.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    if (error.retryAfterSeconds !== undefined) {
      res.setHeader("Retry-After", String(error.retryAfterSeconds));
    }
    res.status(error.statusCode).json({ error: error.message, code: error.code });
    return;
  }

  logger.error({ err: error }, "Unhandled error");
  res.status(500).json({
    error: "Internal server error",
    code: ErrorCodes.INTERNAL_ERROR,
  });
}
