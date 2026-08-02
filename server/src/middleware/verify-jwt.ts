import type { NextFunction, Request, Response } from "express";
import { ErrorCodes } from "../utils/error-codes.js";
import { AppError } from "../utils/errors.js";
import {
  extractBearerToken,
  verifyAccessToken,
  type AccessTokenPayload,
} from "../utils/access-token.js";

export type { AccessTokenPayload };

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      workspaceId?: string;
      workspaceRole?: "owner" | "member";
      routeParams?: Record<string, string>;
    }
  }
}

export function verifyJWT(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next(new AppError(401, "Authentication required", ErrorCodes.AUTH_REQUIRED));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
