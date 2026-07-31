import { prisma } from "../lib/prisma.js";
import { ErrorCodes } from "../utils/error-codes.js";
import { AppError, notFound } from "../utils/errors.js";

export async function assertAssigneeInWorkspace(
  workspaceId: string,
  assigneeId: string,
): Promise<void> {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: assigneeId,
        workspaceId,
      },
    },
    select: { id: true },
  });

  if (!member) {
    throw new AppError(
      400,
      "Assignee must be a member of this workspace",
      ErrorCodes.VALIDATION_ERROR,
    );
  }
}

export async function getBoardInWorkspace(workspaceId: string, boardId: string) {
  const board = await prisma.board.findFirst({
    where: { id: boardId, workspaceId },
  });

  if (!board) {
    throw notFound("Board");
  }

  return board;
}

export async function getColumnInWorkspace(
  workspaceId: string,
  boardId: string,
  columnId: string,
) {
  await getBoardInWorkspace(workspaceId, boardId);

  const column = await prisma.column.findFirst({
    where: { id: columnId, boardId },
  });

  if (!column) {
    throw notFound("Column");
  }

  return column;
}

export async function getTaskInWorkspace(
  workspaceId: string,
  boardId: string,
  columnId: string,
  taskId: string,
) {
  await getColumnInWorkspace(workspaceId, boardId, columnId);

  const task = await prisma.task.findFirst({
    where: { id: taskId, columnId },
  });

  if (!task) {
    throw notFound("Task");
  }

  return task;
}

export async function resolveTaskWorkspace(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      column: {
        select: {
          board: {
            select: {
              id: true,
              workspaceId: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    throw notFound("Task");
  }

  return {
    taskId: task.id,
    boardId: task.column.board.id,
    workspaceId: task.column.board.workspaceId,
  };
}

export async function getTaskByIdInWorkspace(workspaceId: string, taskId: string) {
  const resolved = await resolveTaskWorkspace(taskId);

  if (resolved.workspaceId !== workspaceId) {
    throw notFound("Task");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw notFound("Task");
  }

  return { task, boardId: resolved.boardId };
}
