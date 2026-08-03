import { io as ioClient } from "socket.io-client";

const BASE = "http://localhost:4000";
const ts = Date.now();

async function request(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  return {
    status: res.status,
    json,
  };
}

function waitForEvent(socket, event, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event}`)),
      timeout,
    );

    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function assert(condition, label) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`  ✓ ${label}`);
}

// ============================================================
// Setup users
// ============================================================
console.log("\n=== Setup ===");

const userA = await request("POST", "/auth/signup", {
  body: {
    email: `owner-${ts}@test.com`,
    password: "password123",
    name: "Owner A",
  },
});
const tokenA = userA.json.tokens.accessToken;
console.log("  User A (owner) created");

const userC = await request("POST", "/auth/signup", {
  body: {
    email: `member-${ts}@test.com`,
    password: "password123",
    name: "Member C",
  },
});
const tokenC = userC.json.tokens.accessToken;
console.log("  User C (future member) created");

const userD = await request("POST", "/auth/signup", {
  body: {
    email: `outsider-${ts}@test.com`,
    password: "password123",
    name: "Outsider D",
  },
});
const tokenD = userD.json.tokens.accessToken;
console.log("  User D (outsider) created");

// ============================================================
// Workspace + add member
// ============================================================
console.log("\n=== Workspace membership ===");

const ws = await request("POST", "/workspaces", {
  token: tokenA,
  body: { name: "Realtime Workspace" },
});
const workspaceId = ws.json.workspace.id;
console.log("  Workspace created:", workspaceId);

const addMember = await request(
  "POST",
  `/workspaces/${workspaceId}/members`,
  {
    token: tokenA,
    body: {
      email: `member-${ts}@test.com`,
      role: "member",
    },
  },
);

assert(addMember.status === 201, `Add member returned ${addMember.status}`);
console.log("  User C added as member");

// Verify member list
const memberList = await request(
  "GET",
  `/workspaces/${workspaceId}/members`,
  { token: tokenA },
);
assert(memberList.json.members.length === 2, "Workspace has 2 members");

// ============================================================
// Board + column
// ============================================================
console.log("\n=== Board setup ===");

const board = await request("POST", `/workspaces/${workspaceId}/boards`, {
  token: tokenA,
  body: { name: "Realtime Board" },
});
const boardId = board.json.board.id;

const column = await request(
  "POST",
  `/workspaces/${workspaceId}/boards/${boardId}/columns`,
  {
    token: tokenA,
    body: { name: "Todo", position: 0 },
  },
);
const columnId = column.json.column.id;
console.log("  Board + column created");

// ============================================================
// Socket connections
// ============================================================
console.log("\n=== Socket connections ===");

const socketA = ioClient(BASE, {
  auth: { token: tokenA },
  transports: ["websocket"],
});
await new Promise((resolve, reject) => {
  socketA.on("connect", resolve);
  socketA.on("connect_error", reject);
});
console.log("  Socket A connected");

const socketC = ioClient(BASE, {
  auth: { token: tokenC },
  transports: ["websocket"],
});
await new Promise((resolve, reject) => {
  socketC.on("connect", resolve);
  socketC.on("connect_error", reject);
});
console.log("  Socket C connected");

const socketD = ioClient(BASE, {
  auth: { token: tokenD },
  transports: ["websocket"],
});
await new Promise((resolve, reject) => {
  socketD.on("connect", resolve);
  socketD.on("connect_error", reject);
});
console.log("  Socket D connected");

// ============================================================
// Join board room
// ============================================================
console.log("\n=== Room access control ===");

const joinA = await new Promise((resolve) => {
  socketA.emit("board:join", { boardId }, resolve);
});
assert(joinA.ok, "Owner A joined board room");

const joinC = await new Promise((resolve) => {
  socketC.emit("board:join", { boardId }, resolve);
});
assert(joinC.ok, "Member C joined board room");

const joinD = await new Promise((resolve) => {
  socketD.emit("board:join", { boardId }, resolve);
});
assert(!joinD.ok, "Outsider D blocked from board room");

socketD.close();

// ============================================================
// Task create → User C receives event
// ============================================================
console.log("\n=== Task create (A → C) ===");

const createdPromise = waitForEvent(socketC, "task:created");

const created = await request(
  "POST",
  `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks`,
  {
    token: tokenA,
    body: { title: "Realtime Task", position: 0 },
  },
);
assert(created.status === 201, "Task created via REST");

const createdEvent = await createdPromise;
assert(
  createdEvent.task.title === "Realtime Task",
  `User C received task:created — "${createdEvent.task.title}"`,
);

const taskId = created.json.task.id;

// ============================================================
// Task update → User C receives event
// ============================================================
console.log("\n=== Task update (A → C) ===");

const updatedPromise = waitForEvent(socketC, "task:updated");

await request("PATCH", `/tasks/${taskId}`, {
  token: tokenA,
  body: { status: "done" },
});

const updatedEvent = await updatedPromise;
assert(
  updatedEvent.task.status === "done",
  `User C received task:updated — status="${updatedEvent.task.status}"`,
);

// ============================================================
// Task delete → User C receives event
// ============================================================
console.log("\n=== Task delete (A → C) ===");

const deletedPromise = waitForEvent(socketC, "task:deleted");

await request("DELETE", `/tasks/${taskId}`, { token: tokenA });

const deletedEvent = await deletedPromise;
assert(
  deletedEvent.taskId === taskId,
  `User C received task:deleted — taskId="${deletedEvent.taskId}"`,
);

// ============================================================
// Cleanup
// ============================================================
socketA.close();
socketC.close();

console.log("\n=== Multi-user realtime test passed ===\n");
