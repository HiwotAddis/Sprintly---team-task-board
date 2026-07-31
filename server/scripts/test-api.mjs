const BASE = "http://localhost:4000";
const results = [];

async function test(name, method, path, { token, body, expectedStatus } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }

  const ok = res.status === expectedStatus;
  results.push({ name, expectedStatus, actual: res.status, ok, code: json?.code });
  if (!ok) {
    console.error(`FAIL ${name}: expected ${expectedStatus}, got ${res.status}`, json);
  }
  return { status: res.status, json };
}

const ts = Date.now();

console.log("--- Health ---");
await test("health", "GET", "/health", { expectedStatus: 200 });

console.log("--- Auth ---");
const u1 = await test("signup user1", "POST", "/auth/signup", {
  body: { email: `phase2-u1-${ts}@test.com`, password: "password123", name: "User One" },
  expectedStatus: 201,
});
const token1 = u1.json.tokens.accessToken;
const user1Id = u1.json.user.id;

const u2 = await test("signup user2", "POST", "/auth/signup", {
  body: { email: `phase2-u2-${ts}@test.com`, password: "password123", name: "User Two" },
  expectedStatus: 201,
});
const token2 = u2.json.tokens.accessToken;

await test("no token", "GET", "/workspaces", { expectedStatus: 401 });
await test("bad token", "GET", "/workspaces", { token: "bad.token", expectedStatus: 401 });

console.log("--- Workspaces ---");
const ws = await test("create workspace", "POST", "/workspaces", {
  token: token1,
  body: { name: "Sprint Team" },
  expectedStatus: 201,
});
const wsId = ws.json.workspace.id;

await test("list workspaces", "GET", "/workspaces", { token: token1, expectedStatus: 200 });
await test("get workspace", "GET", `/workspaces/${wsId}`, { token: token1, expectedStatus: 200 });
await test("forbidden workspace", "GET", `/workspaces/${wsId}`, { token: token2, expectedStatus: 403 });
await test("update workspace", "PATCH", `/workspaces/${wsId}`, {
  token: token1,
  body: { name: "Sprint Team Updated" },
  expectedStatus: 200,
});

console.log("--- Boards ---");
const board = await test("create board", "POST", `/workspaces/${wsId}/boards`, {
  token: token1,
  body: { name: "Product Board" },
  expectedStatus: 201,
});
const boardId = board.json.board.id;

await test("list boards", "GET", `/workspaces/${wsId}/boards`, { token: token1, expectedStatus: 200 });
await test("get board", "GET", `/workspaces/${wsId}/boards/${boardId}`, { token: token1, expectedStatus: 200 });
await test("forbidden board", "GET", `/workspaces/${wsId}/boards/${boardId}`, { token: token2, expectedStatus: 403 });
await test("update board", "PATCH", `/workspaces/${wsId}/boards/${boardId}`, {
  token: token1,
  body: { name: "Product Board v2" },
  expectedStatus: 200,
});

console.log("--- Columns ---");
const col1 = await test("create column todo", "POST", `/workspaces/${wsId}/boards/${boardId}/columns`, {
  token: token1,
  body: { name: "Todo", position: 0 },
  expectedStatus: 201,
});
const col2 = await test("create column done", "POST", `/workspaces/${wsId}/boards/${boardId}/columns`, {
  token: token1,
  body: { name: "Done", position: 1 },
  expectedStatus: 201,
});
const col1Id = col1.json.column.id;
const col2Id = col2.json.column.id;

await test("list columns", "GET", `/workspaces/${wsId}/boards/${boardId}/columns`, { token: token1, expectedStatus: 200 });
await test("get column", "GET", `/workspaces/${wsId}/boards/${boardId}/columns/${col1Id}`, { token: token1, expectedStatus: 200 });
await test("update column", "PATCH", `/workspaces/${wsId}/boards/${boardId}/columns/${col1Id}`, {
  token: token1,
  body: { name: "Backlog" },
  expectedStatus: 200,
});

console.log("--- Tasks ---");
const task = await test("create task", "POST", `/workspaces/${wsId}/boards/${boardId}/columns/${col1Id}/tasks`, {
  token: token1,
  body: {
    title: "Setup API",
    description: "Phase 2",
    status: "todo",
    assigneeId: user1Id,
    dueDate: "2026-08-15T00:00:00.000Z",
    position: 0,
  },
  expectedStatus: 201,
});
const taskId = task.json.task.id;

await test("list tasks", "GET", `/workspaces/${wsId}/boards/${boardId}/columns/${col1Id}/tasks`, { token: token1, expectedStatus: 200 });
await test("get task nested", "GET", `/workspaces/${wsId}/boards/${boardId}/columns/${col1Id}/tasks/${taskId}`, { token: token1, expectedStatus: 200 });
await test("get task flat", "GET", `/tasks/${taskId}`, { token: token1, expectedStatus: 200 });
await test("forbidden task flat", "GET", `/tasks/${taskId}`, { token: token2, expectedStatus: 403 });
await test("update task move", "PATCH", `/workspaces/${wsId}/boards/${boardId}/columns/${col1Id}/tasks/${taskId}`, {
  token: token1,
  body: { status: "in_progress", columnId: col2Id, position: 0 },
  expectedStatus: 200,
});
await test("update task flat", "PATCH", `/tasks/${taskId}`, {
  token: token1,
  body: { status: "done" },
  expectedStatus: 200,
});

console.log("--- Deletes ---");
await test("delete task nested", "DELETE", `/workspaces/${wsId}/boards/${boardId}/columns/${col2Id}/tasks/${taskId}`, { token: token1, expectedStatus: 204 });

const task2 = await test("create task2", "POST", `/workspaces/${wsId}/boards/${boardId}/columns/${col1Id}/tasks`, {
  token: token1,
  body: { title: "Delete via flat" },
  expectedStatus: 201,
});
const task2Id = task2.json.task.id;

await test("delete task flat", "DELETE", `/tasks/${task2Id}`, { token: token1, expectedStatus: 204 });
await test("delete column", "DELETE", `/workspaces/${wsId}/boards/${boardId}/columns/${col2Id}`, { token: token1, expectedStatus: 204 });
await test("delete board", "DELETE", `/workspaces/${wsId}/boards/${boardId}`, { token: token1, expectedStatus: 204 });
await test("forbidden delete workspace", "DELETE", `/workspaces/${wsId}`, { token: token2, expectedStatus: 403 });
await test("delete workspace", "DELETE", `/workspaces/${wsId}`, { token: token1, expectedStatus: 204 });

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;
console.log(`\n=== ${passed}/${results.length} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
