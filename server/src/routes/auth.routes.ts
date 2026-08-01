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

export const authRouter: IRouter = Router();

authRouter.post(
  "/signup",
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  }),
);

authRouter.post(
  "/login",
  rateLimitLogin,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  }),
);

authRouter.post(
  "/refresh",
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.status(200).json(tokens);
  }),
);

authRouter.post(
  "/logout",
  validateBody(logoutSchema),
  asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.status(204).send();
  }),
);

authRouter.post(
  "/logout-all",
  verifyJWT,
  asyncHandler(async (req, res) => {
    const result = await authService.logoutAllDevices(req.user!.sub);
    res.status(200).json(result);
  }),
);
