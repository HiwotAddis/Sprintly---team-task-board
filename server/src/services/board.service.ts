import {
  getCachedBoardDetail,
  invalidateBoardDetailCache,
  setCachedBoardDetail,
} from "../lib/board-cache.js";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../utils/errors.js";
import type { CreateBoardInput, UpdateBoardInput } from "../schemas/workspace.schema.js";
import { getBoardInWorkspace } from "./workspace-access.service.js";

const taskSelect = {
  id: true,
  title: true,
  description: true,
  position: true,
  status: true,
  dueDate: true,
  assigneeId: true,
  columnId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type BoardDetail = {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  columns: Array<{
    id: string;
    name: string;
    position: number;
    boardId: string;
    createdAt: Date;
    updatedAt: Date;
    tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      position: number;
      status: string;
      dueDate: Date | null;
      assigneeId: string | null;
      columnId: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }>;
};

async function loadBoardDetailFromDb(
  workspaceId: string,
  boardId: string,
): Promise<BoardDetail> {
  const board = await prisma.board.findFirst({
    where: { id: boardId, workspaceId },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      createdAt: true,
      updatedAt: true,
      columns: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          position: true,
          boardId: true,
          createdAt: true,
          updatedAt: true,
          tasks: {
            orderBy: { position: "asc" },
            select: taskSelect,
          },
        },
      },
    },
  });

  if (!board) {
    throw notFound("Board");
  }

  return board;
}

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

/**
 * Board + nested columns + tasks. Cached in Redis (board-level, not per-user).
 */
export async function getBoardDetail(
  workspaceId: string,
  boardId: string,
): Promise<BoardDetail> {
  await getBoardInWorkspace(workspaceId, boardId);

  const cached = await getCachedBoardDetail<BoardDetail>(boardId);
  if (cached) {
    return cached;
  }

  const board = await loadBoardDetailFromDb(workspaceId, boardId);
  await setCachedBoardDetail(boardId, board);
  return board;
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
    const board = await prisma.board.update({
      where: { id: boardId },
      data: { name: input.name },
    });
    await invalidateBoardDetailCache(boardId);
    return board;
  } catch {
    throw notFound("Board");
  }
}

export async function deleteBoard(workspaceId: string, boardId: string) {
  await getBoardInWorkspace(workspaceId, boardId);

  try {
    await prisma.board.delete({ where: { id: boardId } });
    await invalidateBoardDetailCache(boardId);
  } catch {
    throw notFound("Board");
  }
}