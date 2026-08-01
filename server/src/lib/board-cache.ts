/**
 * Board detail cache (cache-aside pattern)
 *
 * INVALIDATION STRATEGY
 * ---------------------
 * We use **cache-aside** (a.k.a. lazy loading):
 *   - READ:  app checks Redis first; on miss, loads from Postgres and populates the cache.
 *   - WRITE: app updates Postgres, then **deletes** the cache key (does not write through).
 *
 * Why cache-aside (interview talking points):
 *   - **vs read-through**: the cache library would own DB reads; we keep query logic in the
 *     service layer where auth/scoping already lives.
 *   - **vs write-through**: every write would synchronously update Redis; we only need
 *     invalidation because board detail is read-heavy and stale reads must be brief, not zero.
 *   - **vs write-behind**: async DB writes from cache — wrong for authoritative task/column data.
 *
 * Invalidation is **targeted DEL** on `boardDetailKey(boardId)` after any mutation to that
 * board's metadata, columns, or tasks (including reorder/move). Next GET repopulates from DB.
 *
 * KEY NAMING: `sprintly:board:detail:{boardId}`
 *   - `sprintly`  — project namespace (avoids collisions if Redis is shared)
 *   - `board`     — resource type
 *   - `detail`    — payload shape (board + nested columns + tasks, not a list or user view)
 *   - `{boardId}` — globally unique id; board data is shared by all workspace members, so we
 *                   intentionally omit userId (never cache per-user projections here)
 */

import { redis } from "./redis.js";

const TTL_SECONDS = 60;
const KEY_PREFIX = "sprintly:board:detail";

export function boardDetailKey(boardId: string): string {
  return `${KEY_PREFIX}:${boardId}`;
}

export async function getCachedBoardDetail<T>(boardId: string): Promise<T | null> {
  const raw = await redis.get(boardDetailKey(boardId));
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function setCachedBoardDetail(boardId: string, payload: unknown): Promise<void> {
  await redis.set(boardDetailKey(boardId), JSON.stringify(payload), "EX", TTL_SECONDS);
}

export async function invalidateBoardDetailCache(boardId: string): Promise<void> {
  await redis.del(boardDetailKey(boardId));
}
