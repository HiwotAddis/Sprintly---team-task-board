import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import {
  AppError,
  INVALID_CREDENTIALS_MESSAGE,
} from "../utils/errors.js";
import type { LoginInput, SignupInput } from "../schemas/auth.schema.js";
import {
  createAccessToken,
  createRefreshToken,
  issueAuthTokens,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  type AuthTokens,
} from "./token.service.js";
import { env } from "../config/env.js";

const BCRYPT_ROUNDS = 10;

export interface AuthUserResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  tokens: AuthTokens;
}

function toAuthUserResponse(
  user: { id: string; email: string; name: string | null },
  tokens: AuthTokens,
): AuthUserResponse {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    tokens,
  };
}

export async function signup(input: SignupInput): Promise<AuthUserResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: passwordHash,
      name: input.name ?? null,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  logger.info({ userId: user.id }, "User signed up");

  const tokens = await issueAuthTokens(user.id, user.email);
  return toAuthUserResponse(user, tokens);
}

export async function login(input: LoginInput): Promise<AuthUserResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);

  if (!passwordMatches) {
    throw new AppError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  logger.info({ userId: user.id }, "User logged in");

  const tokens = await issueAuthTokens(user.id, user.email);

  return toAuthUserResponse(
    { id: user.id, email: user.email, name: user.name },
    tokens,
  );
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const { userId } = await rotateRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new AppError(401, "Invalid refresh token");
  }

  const accessToken = createAccessToken(user.id, user.email);
  const newRefreshToken = await createRefreshToken(user.id);

  logger.info({ userId: user.id }, "Access token refreshed");

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: env.JWT_EXPIRES_IN,
  };
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    await revokeRefreshToken(refreshToken);
    logger.info("Refresh session revoked");
  } catch {
    // Idempotent logout: client may send an expired or already-revoked token.
  }
}

export async function logoutAllDevices(userId: string): Promise<{ revoked: number }> {
  const revoked = await revokeAllRefreshTokens(userId);
  logger.info({ userId, revoked }, "All user sessions revoked");
  return { revoked };
}
