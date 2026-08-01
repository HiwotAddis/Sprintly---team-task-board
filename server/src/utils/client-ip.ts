import type { Request } from "express";

/**
 * Prefer Express-derived IP (respects trust proxy when configured).
 */
export function getClientIp(req: Request): string {
  if (typeof req.ip === "string" && req.ip.length > 0) {
    return req.ip;
  }

  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return req.socket.remoteAddress ?? "unknown";
}
