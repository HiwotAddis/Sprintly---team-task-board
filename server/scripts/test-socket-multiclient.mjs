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

console.log("=== Setup ===");

// --------------------------------------------
// User A
// --------------------------------------------
const userA = await request("POST", "/auth/signup", {
  body: {
    email: `owner-${ts}@test.com`,
    password: "password123",
    name: "Owner",
  },
});

const tokenA = userA.json.tokens.accessToken;

// --------------------------------------------
// User C (member)
// --------------------------------------------
const userC = await request("POST", "/auth/signup", {
  body: {
    email: `member-${ts}@test.com`,
    password: "password123",
    name: "Member",
  },
});

const tokenC = userC.json.tokens.accessToken;

// --------------------------------------------
// Workspace
// --------------------------------------------
const ws = await request("POST", "/workspaces", {
  token: tokenA,
  body: {
    name: "Realtime Workspace",
  },
});

const workspaceId = ws.json.workspace.id;

// --------------------------------------------
// IMPORTANT
//
// Replace this endpoint with YOUR project's
// workspace invitation/member endpoint.
// --------------------------------------------
const addMember = await request("POST", `/workspaces/${workspaceId}/members`, {
  token: tokenA,
  body: {
    email: `member-${ts}@test.com`,
    role: "member",
  },
});

if (addMember.status >= 400) {
  throw new Error(
    "Failed to add second user to workspace. Update this endpoint to match your API.",
  );
}

// --------------------------------------------
// Board
// --------------------------------------------
const board = await request("POST", `/workspaces/${workspaceId}/boards`, {
  token: tokenA,
  body: {
    name: "Realtime Board",
  },
});

const boardId = board.json.board.id;

// --------------------------------------------
// Column
// --------------------------------------------
const column = await request(
  "POST",
  `/workspaces/${workspaceId}/boards/${boardId}/columns`,
  {
    token: tokenA,
    body: {
      name: "Todo",
      position: 0,
    },
  },
);

const columnId = column.json.column.id;

console.log("=== Connect sockets ===");

// --------------------------------------------
// Socket A
// --------------------------------------------
const socketA = ioClient(BASE, {
  auth: {
    token: tokenA,
  },
  transports: ["websocket"],
});

await new Promise((resolve, reject) => {
  socketA.on("connect", resolve);
  socketA.on("connect_error", reject);
});

// --------------------------------------------
// Socket C
// --------------------------------------------
const socketC = ioClient(BASE, {
  auth: {
    token: tokenC,
  },
  transports: ["websocket"],
});

await new Promise((resolve, reject) => {
  socketC.on("connect", resolve);
  socketC.on("connect_error", reject);
});

console.log("=== Join room ===");

const joinA = await new Promise((resolve) => {
  socketA.emit("board:join", { boardId }, resolve);
});

if (!joinA.ok) {
  throw new Error("Owner failed to join board");
}

const joinC = await new Promise((resolve) => {
  socketC.emit("board:join", { boardId }, resolve);
});

if (!joinC.ok) {
  throw new Error("Second member failed to join board");
}

console.log("=== Create task ===");

// User C waits for User A's event
const createdPromise = waitForEvent(socketC, "task:created");

const created = await request(
  "POST",
  `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks`,
  {
    token: tokenA,
    body: {
      title: "Realtime Task",
      position: 0,
    },
  },
);

if (created.status !== 201) {
  throw new Error("Task creation failed");
}

const createdEvent = await createdPromise;

console.log("✓ User C received task:created");
console.log(createdEvent.task.title);

// --------------------------------------------

console.log("=== Update task ===");

const updatedPromise = waitForEvent(socketC, "task:updated");

await request("PATCH", `/tasks/${created.json.task.id}`, {
  token: tokenA,
  body: {
    status: "done",
    position: 2,
  },
});

const updatedEvent = await updatedPromise;

console.log("✓ User C received task:updated");
console.log(updatedEvent.task.status);

// --------------------------------------------

console.log("=== Delete task ===");

const deletedPromise = waitForEvent(socketC, "task:deleted");

await request("DELETE", `/tasks/${created.json.task.id}`, {
  token: tokenA,
});

const deletedEvent = await deletedPromise;

console.log("✓ User C received task:deleted");
console.log(deletedEvent.taskId);

socketA.close();
socketC.close();

console.log("\n=== Multi-user realtime test passed ===");
