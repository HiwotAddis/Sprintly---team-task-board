import { Router, type IRouter } from "express";
import { rateLimitLogin } from "../middleware/rate-limit-login.js";
import { verifyJWT } from "../middleware/verify-jwt.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { validateBody } from "../middleware/validate.js";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  signupSchema,
} from "../schemas/auth.schema.js";
import * as authService from "../services/auth.service.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function extractRefreshToken(req: { headers: { cookie?: string }; body?: { refreshToken?: string } }): string | undefined {
  if (req.body?.refreshToken) {
    return req.body.refreshToken;
  }
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export const authRouter: IRouter = Router();

authRouter.post(
  "/signup",
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.signup(req.body);
    res.cookie("refreshToken", result.tokens.refreshToken, COOKIE_OPTIONS);
    res.status(201).json(result);
  }),
);

authRouter.post(
  "/login",
  rateLimitLogin,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.cookie("refreshToken", result.tokens.refreshToken, COOKIE_OPTIONS);
    res.status(200).json(result);
  }),
);

authRouter.post(
  "/refresh",
  (req, _res, next) => {
    const token = extractRefreshToken(req);
    if (token) {
      req.body = req.body || {};
      req.body.refreshToken = token;
    }
    next();
  },
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTIONS);
    res.status(200).json(tokens);
  }),
);

authRouter.post(
  "/logout",
  (req, _res, next) => {
    const token = extractRefreshToken(req);
    if (token) {
      req.body = req.body || {};
      req.body.refreshToken = token;
    }
    next();
  },
  validateBody(logoutSchema),
  asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.clearCookie("refreshToken", { path: "/" });
    res.status(204).send();
  }),
);

authRouter.post(
  "/logout-all",
  verifyJWT,
  asyncHandler(async (req, res) => {
    const result = await authService.logoutAllDevices(req.user!.sub);
    res.clearCookie("refreshToken", { path: "/" });
    res.status(200).json(result);
  }),
);

