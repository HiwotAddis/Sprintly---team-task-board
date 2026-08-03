import { prisma } from "../lib/prisma.js";
import { forbidden, notFound } from "../utils/errors.js";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "../utils/error-codes.js";
import type {
  AddMemberInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "../schemas/workspace.schema.js";

export async function listWorkspacesForUser(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }));
}

export async function createWorkspace(userId: string, input: CreateWorkspaceInput) {
  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name: input.name },
    });

    await tx.workspaceMember.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: "owner",
      },
    });

    return workspace;
  });
}

export async function getWorkspace(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!workspace) {
    throw notFound("Workspace");
  }

  return workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
) {
  if (input.name === undefined) {
    return getWorkspace(workspaceId);
  }

  try {
    return await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: input.name },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch {
    throw notFound("Workspace");
  }
}

export async function deleteWorkspace(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
    select: { role: true },
  });

  if (!membership) {
    throw forbidden("You are not a member of this workspace");
  }

  if (membership.role !== "owner") {
    throw forbidden("Only workspace owners can delete a workspace");
  }

  try {
    await prisma.workspace.delete({ where: { id: workspaceId } });
  } catch {
    throw notFound("Workspace");
  }
}

/* ------------------------------------------------------------------ */
/*  Workspace membership                                              */
/* ------------------------------------------------------------------ */

export async function listMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: {
      id: true,
      userId: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function addMember(
  workspaceId: string,
  requesterId: string,
  input: AddMemberInput,
) {
  // Only owners may add members
  const requester = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: requesterId, workspaceId } },
    select: { role: true },
  });

  if (!requester || requester.role !== "owner") {
    throw forbidden("Only workspace owners can add members");
  }

  // Resolve target user by email
  const targetUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (!targetUser) {
    throw notFound("User");
  }

  // Check for existing membership
  const existing = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: targetUser.id, workspaceId },
    },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(
      409,
      "User is already a member of this workspace",
      ErrorCodes.CONFLICT,
    );
  }

  const member = await prisma.workspaceMember.create({
    data: {
      userId: targetUser.id,
      workspaceId,
      role: input.role,
    },
    select: {
      id: true,
      userId: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return member;
}

export async function removeMember(
  workspaceId: string,
  requesterId: string,
  memberId: string,
) {
  const requester = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: requesterId, workspaceId } },
    select: { id: true, role: true },
  });

  if (!requester) {
    throw forbidden("You are not a member of this workspace");
  }

  const target = await prisma.workspaceMember.findUnique({
    where: { id: memberId, workspaceId },
    select: { id: true, userId: true, role: true },
  });

  if (!target) {
    throw notFound("Member");
  }

  const isSelf = target.userId === requesterId;

  if (!isSelf && requester.role !== "owner") {
    throw forbidden("Only workspace owners can remove other members");
  }

  // Prevent removing the last owner
  if (target.role === "owner") {
    const ownerCount = await prisma.workspaceMember.count({
      where: { workspaceId, role: "owner" },
    });

    if (ownerCount <= 1) {
      throw forbidden("Cannot remove the last owner of the workspace");
    }
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });
}
