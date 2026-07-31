import { prisma } from "../lib/prisma.js";
import { notFound } from "../utils/errors.js";
import type { CreateBoardInput, UpdateBoardInput } from "../schemas/workspace.schema.js";
import { getBoardInWorkspace } from "./workspace-access.service.js";

export async function listBoards(workspaceId: string) {
  return prisma.board.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createBoard(workspaceId: string, input: CreateBoardInput) {
  return prisma.board.create({
    data: {
      name: input.name,
      workspaceId,
    },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getBoard(workspaceId: string, boardId: string) {
  return getBoardInWorkspace(workspaceId, boardId);
}

export async function updateBoard(
  workspaceId: string,
  boardId: string,
  input: UpdateBoardInput,
) {
  await getBoardInWorkspace(workspaceId, boardId);

  if (input.name === undefined) {
    return getBoardInWorkspace(workspaceId, boardId);
  }

  try {
    return await prisma.board.update({
      where: { id: boardId },
      data: { name: input.name },
    });
  } catch {
    throw notFound("Board");
  }
}

export async function deleteBoard(workspaceId: string, boardId: string) {
  await getBoardInWorkspace(workspaceId, boardId);

  try {
    await prisma.board.delete({ where: { id: boardId } });
  } catch {
    throw notFound("Board");
  }
}
