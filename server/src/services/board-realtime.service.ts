import { prisma } from "../lib/prisma.js";
import { forbidden, notFound } from "../utils/errors.js";

export function boardRoomName(boardId: string): string {
  return `board:${boardId}`;
}

/**
 * Resolves a board's workspace and verifies the user is a member.
 * Used before allowing a socket to join `board:<boardId>`.
 */
export async function assertUserCanAccessBoard(
  userId: string,
  boardId: string,
): Promise<{ boardId: string; workspaceId: string }> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, workspaceId: true },
  });

  if (!board) {
    throw notFound("Board");
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: board.workspaceId,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    throw forbidden("You are not a member of this workspace");
  }

  return { boardId: board.id, workspaceId: board.workspaceId };
}
