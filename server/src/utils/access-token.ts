import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ErrorCodes } from "./error-codes.js";
import { AppError } from "./errors.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (typeof payload === "string" || !payload.sub) {
      throw new AppError(401, "Invalid or expired access token", ErrorCodes.INVALID_TOKEN);
    }

    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(401, "Invalid or expired access token", ErrorCodes.INVALID_TOKEN);
  }
}

export function extractBearerToken(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length);
}
