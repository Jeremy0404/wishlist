import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";

import cookieParser from "cookie-parser";
import express from "express";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { authCookie, signUser } = await import("../auth/jwt.js");
const { errorHandler } = await import("../middleware/error-handler.js");
const authRouter = (await import("./auth.js")).default;
const { updateUserName } = await import("./auth.js");

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/auth", authRouter);
  app.use(errorHandler);

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function patchName(baseUrl: string, name: unknown, session?: string) {
  return fetch(`${baseUrl}/auth/me`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(session ? { cookie: `${authCookie.name}=${session}` } : {}),
    },
    body: JSON.stringify({ name }),
  });
}

function sessionFor(id = "user-1") {
  return signUser({ id, email: "alexa@example.com" });
}

test("renaming without a session is refused", async () => {
  await withServer(async (baseUrl) => {
    const res = await patchName(baseUrl, "Alexa");

    assert.equal(res.status, 401);
  });
});

test("a blank name is refused before anything is written", async () => {
  await withServer(async (baseUrl) => {
    const res = await patchName(baseUrl, "   ", sessionFor());

    assert.equal(res.status, 400);
  });
});

test("a missing name is refused too", async () => {
  await withServer(async (baseUrl) => {
    const res = await patchName(baseUrl, undefined, sessionFor());

    assert.equal(res.status, 400);
  });
});

type Recorded = {
  where: Array<Record<string, unknown>>;
  updated: Array<Record<string, unknown>>;
  returned: string[][];
};

function createFakeDb(rows: unknown[]) {
  const recorded: Recorded = { where: [], updated: [], returned: [] };

  const db = (table: string) => {
    if (table !== "users") throw new Error(`Unexpected table ${table}`);

    const query = {
      where(criteria: Record<string, unknown>) {
        recorded.where.push(criteria);
        return this;
      },
      update(values: Record<string, unknown>) {
        recorded.updated.push(values);
        return this;
      },
      async returning(columns: string[]) {
        recorded.returned.push(columns);
        return rows;
      },
    };

    return query;
  };

  return { db: db as never, recorded };
}

test("renaming updates the caller's own row and returns it", async () => {
  const { db, recorded } = createFakeDb([
    { id: "user-1", email: "alexa@example.com", name: "Alexa Martin" },
  ]);

  const user = await updateUserName(db, "user-1", "Alexa Martin");

  assert.deepEqual(user, {
    id: "user-1",
    email: "alexa@example.com",
    name: "Alexa Martin",
  });
  assert.deepEqual(recorded.where, [{ id: "user-1" }]);
  assert.deepEqual(recorded.updated, [{ name: "Alexa Martin" }]);
  assert.deepEqual(recorded.returned, [["id", "email", "name"]]);
});

test("renaming an account that no longer exists yields nothing", async () => {
  const { db } = createFakeDb([]);

  assert.equal(await updateUserName(db, "gone", "Alexa"), null);
});
