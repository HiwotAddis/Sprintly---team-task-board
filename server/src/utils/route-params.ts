import type { Request } from "express";
import { ErrorCodes } from "./error-codes.js";
import { AppError } from "./errors.js";

export function requireRouteParams(
  req: Request,
  ...keys: string[]
): Record<string, string> {
  const params = req.routeParams ?? {};

  for (const key of keys) {
    if (!params[key]) {
      throw new AppError(400, `Missing route parameter: ${key}`, ErrorCodes.VALIDATION_ERROR);
    }
  }

  return params as Record<string, string>;
}
