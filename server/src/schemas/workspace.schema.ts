import { z } from "zod";

export const cuidSchema = z.string().min(1, "Invalid id");

export const workspaceIdParamSchema = z.object({
  workspaceId: cuidSchema,
});

export const boardIdParamSchema = workspaceIdParamSchema.extend({
  boardId: cuidSchema,
});

export const columnIdParamSchema = boardIdParamSchema.extend({
  columnId: cuidSchema,
});

export const taskIdParamSchema = columnIdParamSchema.extend({
  taskId: cuidSchema,
});

export const taskIdOnlyParamSchema = z.object({
  taskId: cuidSchema,
});

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
});

export const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
});

export const updateBoardSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
});

export const createColumnSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  position: z.number().int().min(0).optional(),
});

export const updateColumnSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  position: z.number().int().min(0).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional(),
  assigneeId: cuidSchema.nullish(),
  dueDate: z.coerce.date().optional(),
  status: taskStatusSchema.optional(),
  position: z.number().int().min(0).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).nullish(),
  assigneeId: cuidSchema.nullish(),
  dueDate: z.coerce.date().nullish(),
  status: taskStatusSchema.optional(),
  position: z.number().int().min(0).optional(),
  columnId: cuidSchema.optional(),
});

export const workspaceRoleSchema = z.enum(["owner", "member"]);

export const addMemberSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  role: workspaceRoleSchema.optional().default("member"),
});

export const removeMemberParamSchema = workspaceIdParamSchema.extend({
  memberId: cuidSchema,
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
