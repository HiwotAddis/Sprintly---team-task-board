import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "./logger.js";
import {
  assertUserCanAccessBoard,
  boardRoomName,
} from "../services/board-realtime.service.js";
import { setSocketServer } from "../services/task-realtime.service.js";
import { verifyAccessToken } from "../utils/access-token.js";

export function initSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  setSocketServer(io);

  io.use((socket, next) => {
    const rawToken = socket.handshake.auth?.token;
    const token =
      typeof rawToken === "string"
        ? rawToken
        : typeof socket.handshake.headers.authorization === "string" &&
            socket.handshake.headers.authorization.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.slice("Bearer ".length)
          : null;

    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    try {
      socket.data.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error("Invalid or expired access token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user.sub;
    logger.info({ userId, socketId: socket.id }, "Socket connected");

    socket.on("board:join", async (payload: { boardId?: string }, ack) => {
      const boardId = payload?.boardId;

      if (!boardId || typeof boardId !== "string") {
        ack?.({ ok: false, error: "boardId is required" });
        return;
      }

      try {
        await assertUserCanAccessBoard(userId, boardId);
        await socket.join(boardRoomName(boardId));
        logger.info({ userId, boardId, socketId: socket.id }, "Joined board room");
        ack?.({ ok: true, room: boardRoomName(boardId) });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Forbidden";
        ack?.({ ok: false, error: message });
      }
    });

    socket.on("board:leave", (payload: { boardId?: string }) => {
      const boardId = payload?.boardId;
      if (boardId && typeof boardId === "string") {
        void socket.leave(boardRoomName(boardId));
      }
    });

    socket.on("disconnect", () => {
      logger.info({ userId, socketId: socket.id }, "Socket disconnected");
    });
  });

  logger.info("Socket.io initialized");
  return io;
}

declare module "socket.io" {
  interface SocketData {
    user: {
      sub: string;
      email: string;
    };
  }
}
