const BASE = "http://localhost:4000";

async function request(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }

  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    json,
  };
}

const ts = Date.now();
let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`OK  ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}`, detail);
  }
}

console.log("--- Rate limit login ---");
const badLogin = { email: `rl-${ts}@test.com`, password: "wrong" };
for (let i = 1; i <= 5; i++) {
  const r = await request("POST", "/auth/login", { body: badLogin });
  assert(`login attempt ${i} not blocked`, r.status === 401, r);
}

const blocked = await request("POST", "/auth/login", { body: badLogin });
assert("6th login returns 429", blocked.status === 429, blocked);
assert("429 has RATE_LIMITED code", blocked.json?.code === "RATE_LIMITED", blocked.json);
assert("429 has Retry-After header", Number(blocked.headers["retry-after"]) > 0, blocked.headers);

console.log("\n--- Board cache ---");
const signup = await request("POST", "/auth/signup", {
  body: { email: `cache-${ts}@test.com`, password: "password123", name: "Cache User" },
});
const token = signup.json.tokens.accessToken;

const ws = await request("POST", "/workspaces", {
  token,
  body: { name: "Cache WS" },
});
const wsId = ws.json.workspace.id;

const boardRes = await request("POST", `/workspaces/${wsId}/boards`, {
  token,
  body: { name: "Cache Board" },
});
const boardId = boardRes.json.board.id;

const col = await request("POST", `/workspaces/${wsId}/boards/${boardId}/columns`, {
  token,
  body: { name: "Todo", position: 0 },
});
const colId = col.json.column.id;

await request("POST", `/workspaces/${wsId}/boards/${boardId}/columns/${colId}/tasks`, {
  token,
  body: { title: "Cached task", position: 0 },
});

const first = await request("GET", `/workspaces/${wsId}/boards/${boardId}`, { token });
assert("GET board detail includes columns", Array.isArray(first.json?.board?.columns), first.json);
assert("GET board detail includes tasks", first.json?.board?.columns?.[0]?.tasks?.length === 1, first.json);

const second = await request("GET", `/workspaces/${wsId}/boards/${boardId}`, { token });
assert("cached GET still returns columns/tasks", second.json?.board?.columns?.[0]?.tasks?.length === 1, second.json);

await request("PATCH", `/workspaces/${wsId}/boards/${boardId}/columns/${colId}`, {
  token,
  body: { name: "Renamed" },
});

const afterWrite = await request("GET", `/workspaces/${wsId}/boards/${boardId}`, { token });
assert(
  "after column write cache invalidated (new name)",
  afterWrite.json?.board?.columns?.[0]?.name === "Renamed",
  afterWrite.json,
);

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
