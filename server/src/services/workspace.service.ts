import { prisma } from "../lib/prisma.js";
import { forbidden, notFound } from "../utils/errors.js";
import type {
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
