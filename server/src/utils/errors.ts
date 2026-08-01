import type { ErrorCode } from "./error-codes.js";
import { ErrorCodes } from "./error-codes.js";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: ErrorCode,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

export function notFound(resource: string): AppError {
  return new AppError(404, `${resource} not found`, ErrorCodes.NOT_FOUND);
}

export function forbidden(message = "Forbidden"): AppError {
  return new AppError(403, message, ErrorCodes.FORBIDDEN);
}
