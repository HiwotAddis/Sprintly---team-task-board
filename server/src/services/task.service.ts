import { invalidateBoardDetailCache } from "../lib/board-cache.js";
import { prisma } from "../lib/prisma.js";
import { ErrorCodes } from "../utils/error-codes.js";
import { AppError, notFound } from "../utils/errors.js";
import type { CreateTaskInput, UpdateTaskInput } from "../schemas/workspace.schema.js";
import {
  assertAssigneeInWorkspace,
  getColumnInWorkspace,
  getTaskByIdInWorkspace,
  getTaskInWorkspace,
  resolveTaskWorkspace,
} from "./workspace-access.service.js";

async function nextTaskPosition(columnId: string): Promise<number> {
  const last = await prisma.task.findFirst({
    where: { columnId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return (last?.position ?? -1) + 1;
}

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

export async function listTasks(
  workspaceId: string,
  boardId: string,
  columnId: string,
) {
  await getColumnInWorkspace(workspaceId, boardId, columnId);

  return prisma.task.findMany({
    where: { columnId },
    orderBy: { position: "asc" },
    select: taskSelect,
  });
}

export async function createTask(
  workspaceId: string,
  boardId: string,
  columnId: string,
  input: CreateTaskInput,
) {
  await getColumnInWorkspace(workspaceId, boardId, columnId);

  if (input.assigneeId) {
    await assertAssigneeInWorkspace(workspaceId, input.assigneeId);
  }

  const position = input.position ?? (await nextTaskPosition(columnId));

  try {
    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        assigneeId: input.assigneeId ?? null,
        dueDate: input.dueDate ?? null,
        status: input.status ?? "todo",
        position,
        columnId,
      },
      select: taskSelect,
    });
    await invalidateBoardDetailCache(boardId);
    return task;
  } catch {
    throw new AppError(
      409,
      "Task position already exists in this column",
      ErrorCodes.CONFLICT,
    );
  }
}

export async function getTask(
  workspaceId: string,
  boardId: string,
  columnId: string,
  taskId: string,
) {
  return getTaskInWorkspace(workspaceId, boardId, columnId, taskId);
}

export async function getTaskById(workspaceId: string, taskId: string) {
  const { task } = await getTaskByIdInWorkspace(workspaceId, taskId);
  return task;
}

export async function updateTask(
  workspaceId: string,
  boardId: string,
  columnId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  await getTaskInWorkspace(workspaceId, boardId, columnId, taskId);

  if (input.assigneeId) {
    await assertAssigneeInWorkspace(workspaceId, input.assigneeId);
  }

  if (input.columnId && input.columnId !== columnId) {
    await getColumnInWorkspace(workspaceId, boardId, input.columnId);
  }

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.assigneeId !== undefined
          ? { assigneeId: input.assigneeId }
          : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
        ...(input.columnId !== undefined ? { columnId: input.columnId } : {}),
      },
      select: taskSelect,
    });
    await invalidateBoardDetailCache(boardId);
    return task;
  } catch {
    throw new AppError(
      409,
      "Task position already exists in this column",
      ErrorCodes.CONFLICT,
    );
  }
}

export async function updateTaskById(
  workspaceId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  const { task, boardId } = await getTaskByIdInWorkspace(workspaceId, taskId);
  return updateTask(
    workspaceId,
    boardId,
    task.columnId,
    taskId,
    input,
  );
}

export async function deleteTask(
  workspaceId: string,
  boardId: string,
  columnId: string,
  taskId: string,
) {
  await getTaskInWorkspace(workspaceId, boardId, columnId, taskId);

  try {
    await prisma.task.delete({ where: { id: taskId } });
    await invalidateBoardDetailCache(boardId);
  } catch {
    throw notFound("Task");
  }
}

export async function deleteTaskById(workspaceId: string, taskId: string) {
  const resolved = await resolveTaskWorkspace(taskId);

  if (resolved.workspaceId !== workspaceId) {
    throw notFound("Task");
  }

  await deleteTask(
    workspaceId,
    resolved.boardId,
    (
      await prisma.task.findUniqueOrThrow({
        where: { id: taskId },
        select: { columnId: true },
      })
    ).columnId,
    taskId,
  );
}

export async function getTaskContext(taskId: string) {
  return resolveTaskWorkspace(taskId);
}
