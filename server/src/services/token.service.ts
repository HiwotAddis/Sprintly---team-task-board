import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { durationToSeconds, env } from "../config/env.js";
import { redis } from "../lib/redis.js";
import { AppError } from "../utils/errors.js";

const REFRESH_KEY_PREFIX = "refresh";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RefreshTokenClaims {
  userId: string;
  tokenId: string;
}

function refreshKey(userId: string, tokenId: string): string {
  return `${REFRESH_KEY_PREFIX}:${userId}:${tokenId}`;
}

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function encodeRefreshToken(
  userId: string,
  tokenId: string,
  secret: string,
): string {
  return Buffer.from(`${userId}.${tokenId}.${secret}`, "utf8").toString(
    "base64url",
  );
}

function decodeRefreshToken(token: string): RefreshTokenClaims & { secret: string } {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userId, tokenId, secret] = decoded.split(".");

    if (!userId || !tokenId || !secret) {
      throw new Error("Malformed refresh token");
    }

    return { userId, tokenId, secret };
  } catch {
    throw new AppError(401, "Invalid refresh token");
  }
}

export function createAccessToken(userId: string, email: string): string {
  return jwt.sign({ email }, env.JWT_SECRET, {
    subject: userId,
    expiresIn: durationToSeconds(env.JWT_EXPIRES_IN),
  });
}

export async function issueAuthTokens(
  userId: string,
  email: string,
): Promise<AuthTokens> {
  const accessToken = createAccessToken(userId, email);
  const refreshToken = await createRefreshToken(userId);

  return {
    accessToken,
    refreshToken,
    expiresIn: env.JWT_EXPIRES_IN,
  };
}

export async function createRefreshToken(userId: string): Promise<string> {
  const tokenId = randomUUID();
  const secret = randomBytes(32).toString("base64url");
  const ttlSeconds = durationToSeconds(env.JWT_REFRESH_EXPIRES_IN);

  await redis.set(
    refreshKey(userId, tokenId),
    hashSecret(secret),
    "EX",
    ttlSeconds,
  );

  return encodeRefreshToken(userId, tokenId, secret);
}

export async function verifyRefreshToken(
  refreshToken: string,
): Promise<RefreshTokenClaims> {
  const { userId, tokenId, secret } = decodeRefreshToken(refreshToken);
  const storedHash = await redis.get(refreshKey(userId, tokenId));

  if (!storedHash || storedHash !== hashSecret(secret)) {
    throw new AppError(401, "Invalid refresh token");
  }

  return { userId, tokenId };
}

export async function revokeRefreshTokenByClaims(
  userId: string,
  tokenId: string,
): Promise<void> {
  await redis.del(refreshKey(userId, tokenId));
}

export async function revokeRefreshToken(
  refreshToken: string,
): Promise<void> {
  const { userId, tokenId } = decodeRefreshToken(refreshToken);
  await revokeRefreshTokenByClaims(userId, tokenId);
}

export async function revokeAllRefreshTokens(userId: string): Promise<number> {
  const pattern = `${REFRESH_KEY_PREFIX}:${userId}:*`;
  let cursor = "0";
  let deleted = 0;

  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100,
    );
    cursor = nextCursor;

    if (keys.length > 0) {
      deleted += await redis.del(...keys);
    }
  } while (cursor !== "0");

  return deleted;
}

export async function rotateRefreshToken(
  refreshToken: string,
): Promise<RefreshTokenClaims> {
  const claims = await verifyRefreshToken(refreshToken);
  await revokeRefreshTokenByClaims(claims.userId, claims.tokenId);
  return claims;
}
