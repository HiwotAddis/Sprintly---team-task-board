import type { NextFunction, Request, Response } from "express";
import { redis } from "../lib/redis.js";
import { ErrorCodes } from "../utils/error-codes.js";
import { AppError } from "../utils/errors.js";
import { getClientIp } from "../utils/client-ip.js";

/**
 * Fixed-window rate limit for login attempts.
 *
 * We use a **fixed window** (not sliding): one Redis key per IP, INCR + EXPIRE on first hit.
 * Fixed windows are simpler (O(1) Redis ops, no sorted sets), use less memory, and are
 * standard for login brute-force protection where blocking sustained bursts matters more
 * than perfect boundary fairness. Trade-off: up to 2× limit can slip across window edges;
 * acceptable for 5 attempts / 15 minutes.
 */
const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 5;
const KEY_PREFIX = "ratelimit:login:ip";

function loginRateLimitKey(ip: string): string {
  return `${KEY_PREFIX}:${ip}`;
}

export async function rateLimitLogin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const ip = getClientIp(req);
  const key = loginRateLimitKey(ip);

  try {
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    if (count > MAX_ATTEMPTS) {
      const ttl = await redis.ttl(key);
      const retryAfterSeconds = ttl > 0 ? ttl : WINDOW_SECONDS;

      next(
        new AppError(
          429,
          "Too many login attempts. Try again later.",
          ErrorCodes.RATE_LIMITED,
          retryAfterSeconds,
        ),
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
