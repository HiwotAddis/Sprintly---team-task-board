import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { resolveTaskWorkspace } from "../services/workspace-access.service.js";
import { requireRouteParams } from "../utils/route-params.js";
import { ErrorCodes } from "../utils/error-codes.js";
import { AppError, forbidden } from "../utils/errors.js";

/**
 * Resolves workspace via task → column → board, then enforces membership.
 * Use when the URL has only :taskId (no :workspaceId).
 */
export async function requireWorkspaceMemberViaTask(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  let taskId: string;

  try {
    taskId = requireRouteParams(req, "taskId").taskId;
  } catch (error) {
    next(error);
    return;
  }

  if (!req.user?.sub) {
    next(new AppError(401, "Authentication required", ErrorCodes.AUTH_REQUIRED));
    return;
  }

  let workspaceId: string;

  try {
    const resolved = await resolveTaskWorkspace(taskId);
    workspaceId = resolved.workspaceId;
  } catch (error) {
    next(error);
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
