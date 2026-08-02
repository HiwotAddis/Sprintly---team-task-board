import { io as ioClient } from "socket.io-client";

const BASE = "http://localhost:4000";
const ts = Date.now();

async function request(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

function waitForEvent(socket, event, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

console.log("--- Setup users & board ---");
const u1 = await request("POST", "/auth/signup", {
  body: { email: `socket-a-${ts}@test.com`, password: "password123", name: "User A" },
});
const tokenA = u1.json.tokens.accessToken;

const u2 = await request("POST", "/auth/signup", {
  body: { email: `socket-b-${ts}@test.com`, password: "password123", name: "User B" },
});
const tokenB = u2.json.tokens.accessToken;

const ws = await request("POST", "/workspaces", { token: tokenA, body: { name: "Realtime WS" } });
const wsId = ws.json.workspace.id;

const boardRes = await request("POST", `/workspaces/${wsId}/boards`, {
  token: tokenA,
  body: { name: "Live Board" },
});
const boardId = boardRes.json.board.id;

const col = await request("POST", `/workspaces/${wsId}/boards/${boardId}/columns`, {
  token: tokenA,
  body: { name: "Todo", position: 0 },
});
const colId = col.json.column.id;

console.log("--- Socket auth ---");
const badSocket = ioClient(BASE, { auth: { token: "bad.token" }, transports: ["websocket"] });
await new Promise((resolve) => {
  badSocket.on("connect_error", (err) => {
    console.log("OK  unauthenticated socket rejected:", err.message);
    resolve(null);
  });
  badSocket.on("connect", () => {
    console.error("FAIL bad token connected");
    resolve(null);
  });
});
badSocket.close();

const socketB = ioClient(BASE, { auth: { token: tokenB }, transports: ["websocket"] });
await new Promise((resolve, reject) => {
  socketB.on("connect", () => resolve(null));
  socketB.on("connect_error", reject);
});

const joinForbidden = await new Promise((resolve) => {
  socketB.emit("board:join", { boardId }, resolve);
});
console.log(
  joinForbidden.ok ? "FAIL outsider joined room" : "OK  outsider blocked from board room",
  joinForbidden,
);

console.log("--- Realtime task update ---");
const socketA = ioClient(BASE, { auth: { token: tokenA }, transports: ["websocket"] });
await new Promise((resolve, reject) => {
  socketA.on("connect", () => resolve(null));
  socketA.on("connect_error", reject);
});

const joinA = await new Promise((resolve) => {
  socketA.emit("board:join", { boardId }, resolve);
});
if (!joinA.ok) throw new Error("User A failed to join board");

const eventPromise = waitForEvent(socketA, "task:created");

const created = await request(
  "POST",
  `/workspaces/${wsId}/boards/${boardId}/columns/${colId}/tasks`,
  { token: tokenA, body: { title: "Live task", position: 0 } },
);
if (created.status !== 201) throw new Error("Failed to create task via REST");

const event = await eventPromise;
console.log("OK  socket received task:created", event.task?.title);

const updatePromise = waitForEvent(socketA, "task:updated");
await request("PATCH", `/tasks/${created.json.task.id}`, {
  token: tokenA,
  body: { status: "in_progress", position: 1 },
});
const updated = await updatePromise;
console.log("OK  User A received task:updated", updated.task?.status);

const deletePromise = waitForEvent(socketA, "task:deleted");
await request("DELETE", `/tasks/${created.json.task.id}`, { token: tokenA });
const deleted = await deletePromise;
console.log("OK  User A received task:deleted", deleted.taskId);

socketA.close();
socketB.close();
console.log("\n=== Phase 4 socket tests passed ===");
