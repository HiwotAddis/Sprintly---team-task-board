import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ErrorCodes } from "../utils/error-codes.js";
import { AppError } from "../utils/errors.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

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
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Authentication required", ErrorCodes.AUTH_REQUIRED));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (typeof payload === "string" || !payload.sub) {
      next(
        new AppError(401, "Invalid or expired access token", ErrorCodes.INVALID_TOKEN),
      );
      return;
    }

    req.user = {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
    };
    next();
  } catch {
    next(
      new AppError(401, "Invalid or expired access token", ErrorCodes.INVALID_TOKEN),
    );
  }
}
