import { Router, type IRouter } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireWorkspaceMember } from "../middleware/require-workspace-member.js";
import { requireWorkspaceMemberViaTask } from "../middleware/require-workspace-member-via-task.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { verifyJWT } from "../middleware/verify-jwt.js";
import {
  boardIdParamSchema,
  columnIdParamSchema,
  createBoardSchema,
  createColumnSchema,
  createTaskSchema,
  createWorkspaceSchema,
  taskIdOnlyParamSchema,
  taskIdParamSchema,
  updateBoardSchema,
  updateColumnSchema,
  updateTaskSchema,
  updateWorkspaceSchema,
  workspaceIdParamSchema,
} from "../schemas/workspace.schema.js";
import * as boardService from "../services/board.service.js";
import * as columnService from "../services/column.service.js";
import * as taskService from "../services/task.service.js";
import * as workspaceService from "../services/workspace.service.js";
import { requireRouteParams } from "../utils/route-params.js";

export const workspacesRouter: IRouter = Router();

workspacesRouter.get(
  "/",
  verifyJWT,
  asyncHandler(async (req, res) => {
    const workspaces = await workspaceService.listWorkspacesForUser(req.user!.sub);
    res.json({ workspaces });
  }),
);

workspacesRouter.post(
  "/",
  verifyJWT,
  validateBody(createWorkspaceSchema),
  asyncHandler(async (req, res) => {
    const workspace = await workspaceService.createWorkspace(
      req.user!.sub,
      req.body,
    );
    res.status(201).json({ workspace });
  }),
);

const workspaceMemberRouter: IRouter = Router({ mergeParams: true });

workspaceMemberRouter.use(requireWorkspaceMember);

workspaceMemberRouter.get(
  "/",
  /*
   * ATTACK (no requireWorkspaceMember): Any authenticated user could read
   * workspace metadata by guessing/enumerating workspaceId values.
   */
  asyncHandler(async (req, res) => {
    const workspace = await workspaceService.getWorkspace(requireRouteParams(req, "workspaceId").workspaceId);
    res.json({ workspace });
  }),
);

workspaceMemberRouter.patch(
  "/",
  validateBody(updateWorkspaceSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Cross-workspace rename / metadata tampering
   * for any workspaceId the attacker can reference.
   */
  asyncHandler(async (req, res) => {
    const workspace = await workspaceService.updateWorkspace(
      requireRouteParams(req, "workspaceId").workspaceId,
      req.body,
    );
    res.json({ workspace });
  }),
);

workspaceMemberRouter.delete(
  "/",
  /*
   * ATTACK (no requireWorkspaceMember): Permanent deletion of another team's workspace
   * (service layer also checks owner role, but membership gate must run first).
   */
  asyncHandler(async (req, res) => {
    await workspaceService.deleteWorkspace(
      requireRouteParams(req, "workspaceId").workspaceId,
      req.user!.sub,
    );
    res.status(204).send();
  }),
);

workspaceMemberRouter.get(
  "/boards",
  /*
   * ATTACK (no requireWorkspaceMember): Lists all boards in a foreign workspace.
   */
  asyncHandler(async (req, res) => {
    const boards = await boardService.listBoards(requireRouteParams(req, "workspaceId").workspaceId);
    res.json({ boards });
  }),
);

workspaceMemberRouter.post(
  "/boards",
  validateBody(createBoardSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Inject boards into another workspace.
   */
  asyncHandler(async (req, res) => {
    const board = await boardService.createBoard(requireRouteParams(req, "workspaceId").workspaceId, req.body);
    res.status(201).json({ board });
  }),
);

workspaceMemberRouter.get(
  "/boards/:boardId",
  validateParams(boardIdParamSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Read board details if boardId belongs to
   * another workspace but attacker passes that workspace's board UUID (IDOR via URL mismatch
   * is blocked in service by workspaceId+boardId join; without middleware, list/create
   * endpoints still leak workspace structure).
   */
  asyncHandler(async (req, res) => {
    const board = await boardService.getBoard(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
    );
    res.json({ board });
  }),
);

workspaceMemberRouter.patch(
  "/boards/:boardId",
  validateParams(boardIdParamSchema),
  validateBody(updateBoardSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Rename boards in workspaces the user does not belong to
   * when combined with a leaked boardId (service scopes by workspaceId from URL).
   */
  asyncHandler(async (req, res) => {
    const board = await boardService.updateBoard(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
      req.body,
    );
    res.json({ board });
  }),
);

workspaceMemberRouter.delete(
  "/boards/:boardId",
  validateParams(boardIdParamSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Delete boards from foreign workspaces.
   */
  asyncHandler(async (req, res) => {
    await boardService.deleteBoard(requireRouteParams(req, "workspaceId").workspaceId, requireRouteParams(req, "workspaceId", "boardId").boardId);
    res.status(204).send();
  }),
);

workspaceMemberRouter.get(
  "/boards/:boardId/columns",
  validateParams(boardIdParamSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Enumerate column layout for another workspace's board.
   */
  asyncHandler(async (req, res) => {
    const columns = await columnService.listColumns(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
    );
    res.json({ columns });
  }),
);

workspaceMemberRouter.post(
  "/boards/:boardId/columns",
  validateParams(boardIdParamSchema),
  validateBody(createColumnSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Add columns to someone else's board.
   */
  asyncHandler(async (req, res) => {
    const column = await columnService.createColumn(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
      req.body,
    );
    res.status(201).json({ column });
  }),
);

workspaceMemberRouter.get(
  "/boards/:boardId/columns/:columnId",
  validateParams(columnIdParamSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Read column metadata from foreign boards.
   */
  asyncHandler(async (req, res) => {
    const column = await columnService.getColumn(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
      requireRouteParams(req, "workspaceId", "boardId", "columnId").columnId,
    );
    res.json({ column });
  }),
);

workspaceMemberRouter.patch(
  "/boards/:boardId/columns/:columnId",
  validateParams(columnIdParamSchema),
  validateBody(updateColumnSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Reorder/rename columns on foreign boards (drag-drop impact).
   */
  asyncHandler(async (req, res) => {
    const column = await columnService.updateColumn(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
      requireRouteParams(req, "workspaceId", "boardId", "columnId").columnId,
      req.body,
    );
    res.json({ column });
  }),
);

workspaceMemberRouter.delete(
  "/boards/:boardId/columns/:columnId",
  validateParams(columnIdParamSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Delete columns (and cascade tasks) on foreign boards.
   */
  asyncHandler(async (req, res) => {
    await columnService.deleteColumn(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
      requireRouteParams(req, "workspaceId", "boardId", "columnId").columnId,
    );
    res.status(204).send();
  }),
);

workspaceMemberRouter.get(
  "/boards/:boardId/columns/:columnId/tasks",
  validateParams(columnIdParamSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Full task list leak for a foreign column.
   */
  asyncHandler(async (req, res) => {
    const tasks = await taskService.listTasks(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
      requireRouteParams(req, "workspaceId", "boardId", "columnId").columnId,
    );
    res.json({ tasks });
  }),
);

workspaceMemberRouter.post(
  "/boards/:boardId/columns/:columnId/tasks",
  validateParams(columnIdParamSchema),
  validateBody(createTaskSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Create tasks (incl. assignee/due date) in foreign columns.
   */
  asyncHandler(async (req, res) => {
    const task = await taskService.createTask(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
      requireRouteParams(req, "workspaceId", "boardId", "columnId").columnId,
      req.body,
    );
    res.status(201).json({ task });
  }),
);

workspaceMemberRouter.get(
  "/boards/:boardId/columns/:columnId/tasks/:taskId",
  validateParams(taskIdParamSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Read individual tasks (titles, descriptions, assignees).
   */
  asyncHandler(async (req, res) => {
    const task = await taskService.getTask(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
      requireRouteParams(req, "workspaceId", "boardId", "columnId").columnId,
      requireRouteParams(req, "taskId").taskId,
    );
    res.json({ task });
  }),
);

workspaceMemberRouter.patch(
  "/boards/:boardId/columns/:columnId/tasks/:taskId",
  validateParams(taskIdParamSchema),
  validateBody(updateTaskSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Modify or move tasks across foreign boards/columns.
   */
  asyncHandler(async (req, res) => {
    const task = await taskService.updateTask(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
      requireRouteParams(req, "workspaceId", "boardId", "columnId").columnId,
      requireRouteParams(req, "taskId").taskId,
      req.body,
    );
    res.json({ task });
  }),
);

workspaceMemberRouter.delete(
  "/boards/:boardId/columns/:columnId/tasks/:taskId",
  validateParams(taskIdParamSchema),
  /*
   * ATTACK (no requireWorkspaceMember): Delete tasks from foreign workspaces.
   */
  asyncHandler(async (req, res) => {
    await taskService.deleteTask(
      requireRouteParams(req, "workspaceId").workspaceId,
      requireRouteParams(req, "workspaceId", "boardId").boardId,
      requireRouteParams(req, "workspaceId", "boardId", "columnId").columnId,
      requireRouteParams(req, "taskId").taskId,
    );
    res.status(204).send();
  }),
);

workspacesRouter.use(
  "/:workspaceId",
  verifyJWT,
  validateParams(workspaceIdParamSchema),
  workspaceMemberRouter,
);

export const tasksRouter: IRouter = Router();

tasksRouter.get(
  "/:taskId",
  verifyJWT,
  validateParams(taskIdOnlyParamSchema),
  requireWorkspaceMemberViaTask,
  /*
   * ATTACK (no requireWorkspaceMemberViaTask): Direct task IDOR — read any task by UUID
   * without proving membership in the task's workspace (parent chain: task→column→board→workspace).
   */
  asyncHandler(async (req, res) => {
    const task = await taskService.getTaskById(
      req.workspaceId!,
      requireRouteParams(req, "taskId").taskId,
    );
    res.json({ task });
  }),
);

tasksRouter.patch(
  "/:taskId",
  verifyJWT,
  validateParams(taskIdOnlyParamSchema),
  validateBody(updateTaskSchema),
  requireWorkspaceMemberViaTask,
  /*
   * ATTACK (no requireWorkspaceMemberViaTask): Update/move any task by id alone.
   */
  asyncHandler(async (req, res) => {
    const task = await taskService.updateTaskById(
      req.workspaceId!,
      requireRouteParams(req, "taskId").taskId,
      req.body,
    );
    res.json({ task });
  }),
);

tasksRouter.delete(
  "/:taskId",
  verifyJWT,
  validateParams(taskIdOnlyParamSchema),
  requireWorkspaceMemberViaTask,
  /*
   * ATTACK (no requireWorkspaceMemberViaTask): Delete any task by id alone.
   */
  asyncHandler(async (req, res) => {
    await taskService.deleteTaskById(req.workspaceId!, requireRouteParams(req, "taskId").taskId);
    res.status(204).send();
  }),
);
