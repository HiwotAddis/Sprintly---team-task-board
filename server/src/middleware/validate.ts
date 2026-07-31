import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ErrorCodes } from "../utils/error-codes.js";
import { AppError } from "../utils/errors.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid request body";
      next(new AppError(400, message, ErrorCodes.VALIDATION_ERROR));
      return;
    }

    req.body = result.data;
    next();
  };
}

function mergeRouteParams(req: Request, data: Record<string, unknown>): void {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      params[key] = value;
    }
  }
  req.routeParams = { ...req.routeParams, ...params };
}

export function validateParams<T extends Record<string, unknown>>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid route parameters";
      next(new AppError(400, message, ErrorCodes.VALIDATION_ERROR));
      return;
    }

    mergeRouteParams(req, result.data);
    next();
  };
}
