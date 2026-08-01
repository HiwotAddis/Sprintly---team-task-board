import { invalidateBoardDetailCache } from "../lib/board-cache.js";
import { prisma } from "../lib/prisma.js";
import { ErrorCodes } from "../utils/error-codes.js";
import { AppError, notFound } from "../utils/errors.js";
import type { CreateColumnInput, UpdateColumnInput } from "../schemas/workspace.schema.js";
import {
  getBoardInWorkspace,
  getColumnInWorkspace,
} from "./workspace-access.service.js";

async function nextColumnPosition(boardId: string): Promise<number> {
  const last = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return (last?.position ?? -1) + 1;
}

export async function listColumns(workspaceId: string, boardId: string) {
  await getBoardInWorkspace(workspaceId, boardId);

  return prisma.column.findMany({
    where: { boardId },
    orderBy: { position: "asc" },
  });
}

export async function createColumn(
  workspaceId: string,
  boardId: string,
  input: CreateColumnInput,
) {
  await getBoardInWorkspace(workspaceId, boardId);

  const position =
    input.position ?? (await nextColumnPosition(boardId));

  try {
    const column = await prisma.column.create({
      data: {
        name: input.name,
        boardId,
        position,
      },
    });
    await invalidateBoardDetailCache(boardId);
    return column;
  } catch {
    throw new AppError(
      409,
      "Column position already exists on this board",
      ErrorCodes.CONFLICT,
    );
  }
}

export async function getColumn(
  workspaceId: string,
  boardId: string,
  columnId: string,
) {
  return getColumnInWorkspace(workspaceId, boardId, columnId);
}

export async function updateColumn(
  workspaceId: string,
  boardId: string,
  columnId: string,
  input: UpdateColumnInput,
) {
  await getColumnInWorkspace(workspaceId, boardId, columnId);

  if (input.name === undefined && input.position === undefined) {
    return getColumnInWorkspace(workspaceId, boardId, columnId);
  }

  try {
    const column = await prisma.column.update({
      where: { id: columnId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
      },
    });
    await invalidateBoardDetailCache(boardId);
    return column;
  } catch {
    throw new AppError(
      409,
      "Column position already exists on this board",
      ErrorCodes.CONFLICT,
    );
  }
}

export async function deleteColumn(
  workspaceId: string,
  boardId: string,
  columnId: string,
) {
  await getColumnInWorkspace(workspaceId, boardId, columnId);

  try {
    await prisma.column.delete({ where: { id: columnId } });
    await invalidateBoardDetailCache(boardId);
  } catch {
    throw notFound("Column");
  }
}
