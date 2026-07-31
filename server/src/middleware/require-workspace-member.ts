import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRouteParams } from "../utils/route-params.js";
import { ErrorCodes } from "../utils/error-codes.js";
import { AppError, forbidden } from "../utils/errors.js";

/**
 * Ensures the authenticated user belongs to `req.params.workspaceId`.
 * Must run after verifyJWT.
 */
export async function requireWorkspaceMember(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  let workspaceId: string;

  try {
    workspaceId = requireRouteParams(req, "workspaceId").workspaceId;
  } catch (error) {
    next(error);
    return;
  }

  if (!req.user?.sub) {
    next(new AppError(401, "Authentication required", ErrorCodes.AUTH_REQUIRED));
    return;
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: req.user.sub,
        workspaceId,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    next(forbidden("You are not a member of this workspace"));
    return;
  }

  req.workspaceId = workspaceId;
  req.workspaceRole = membership.role;
  next();
}
