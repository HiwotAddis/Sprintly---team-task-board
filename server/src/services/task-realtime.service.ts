/**
 * Real-time task broadcasts (REST writes, sockets notify).
 *
 * SOCKET AUTH — how it works (the part people get wrong)
 * ------------------------------------------------------
 * 1. HTTP login/signup returns a JWT access token (same as REST).
 * 2. Client opens a Socket.io connection and passes that token in the
 *    **handshake**, e.g. `io({ auth: { token: accessToken } })`.
 * 3. Server middleware runs **before** `connect` fires — invalid/missing
 *    tokens reject the connection entirely (no events, no rooms).
 * 4. Only after a verified connection may the client emit `board:join`.
 * 5. Joining a room re-checks workspace membership in Postgres — knowing
 *    a board UUID is not enough without being a workspace member.
 *
 * REST remains the source of truth; these events push already-persisted data.
 */

import type { Server } from "socket.io";
import { boardRoomName } from "../services/board-realtime.service.js";

export type TaskSocketPayload = {
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
};

let io: Server | null = null;

export function setSocketServer(server: Server): void {
  io = server;
}

function getIo(): Server {
  if (!io) {
    throw new Error("Socket.io server is not initialized");
  }
  return io;
}

export function emitTaskCreated(boardId: string, task: TaskSocketPayload): void {
  getIo().to(boardRoomName(boardId)).emit("task:created", { boardId, task });
}

export function emitTaskUpdated(boardId: string, task: TaskSocketPayload): void {
  getIo().to(boardRoomName(boardId)).emit("task:updated", { boardId, task });
}

export function emitTaskDeleted(
  boardId: string,
  payload: { taskId: string; columnId: string },
): void {
  getIo().to(boardRoomName(boardId)).emit("task:deleted", { boardId, ...payload });
}
