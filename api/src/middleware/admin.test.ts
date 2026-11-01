import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";

import cookieParser from "cookie-parser";
import express from "express";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { authCookie, signUser } = await import("../auth/jwt.js");
const { errorHandler } = await import("./error-handler.js");
const { authRequired } = await import("./auth.js");
const { adminRequired, isAdminEmail, parseAdminEmails } = await import(
  "./admin.js"
);

const ADMINS = parseAdminEmails(" Admin@Site.test ,, other@site.test");

function createUsersDb(emails: Record<string, string | null>) {
  return ((table: string) => {
    if (table !== "users") throw new Error(`Unexpected table ${table}`);
    let id = "";
    return {
      select() {
        return this;
      },
      where(criteria: { id: string }) {
        id = criteria.id;
        return this;
      },
      async first() {
        return id in emails ? { email: emails[id] } : undefined;
      },
    };
  }) as any;
}

async function withServer(
  emails: Record<string, string | null>,
  run: (baseUrl: string) => Promise<void>,
) {
  const app = express();
  app.use(cookieParser());
  app.get("/admin", authRequired, adminRequired(createUsersDb(emails), ADMINS), (_req, res) => {
    res.json({ ok: true });
  });
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

function getAdmin(baseUrl: string, userId?: string) {
  return fetch(`${baseUrl}/admin`, {
    headers: userId
      ? { cookie: `${authCookie.name}=${signUser({ id: userId })}` }
      : {},
  });
}

test("admin addresses are trimmed, lower-cased and blanks dropped", () => {
  assert.deepEqual([...ADMINS], ["admin@site.test", "other@site.test"]);
  assert.equal(parseAdminEmails(undefined).size, 0);
  assert.equal(parseAdminEmails("").size, 0);
});

test("an address matches whatever its case, and no address never does", () => {
  assert.equal(isAdminEmail("ADMIN@site.test", ADMINS), true);
  assert.equal(isAdminEmail("member@site.test", ADMINS), false);
  assert.equal(isAdminEmail(null, ADMINS), false);
});

test("the admin screen refuses a guest", async () => {
  await withServer({}, async (baseUrl) => {
    assert.equal((await getAdmin(baseUrl)).status, 401);
  });
});

test("the admin screen refuses a member", async () => {
  await withServer({ "user-1": "member@site.test" }, async (baseUrl) => {
    assert.equal((await getAdmin(baseUrl, "user-1")).status, 403);
  });
});

test("the admin screen refuses an account without email", async () => {
  await withServer({ "user-1": null }, async (baseUrl) => {
    assert.equal((await getAdmin(baseUrl, "user-1")).status, 403);
  });
});

test("the admin screen opens for a listed address", async () => {
  await withServer({ "user-1": "admin@site.test" }, async (baseUrl) => {
    assert.equal((await getAdmin(baseUrl, "user-1")).status, 200);
  });
});

test("admin rights follow the address in the database, not the session", async () => {
  const emails: Record<string, string | null> = { "user-1": "admin@site.test" };
  await withServer(emails, async (baseUrl) => {
    assert.equal((await getAdmin(baseUrl, "user-1")).status, 200);
    emails["user-1"] = "renamed@site.test";
    assert.equal((await getAdmin(baseUrl, "user-1")).status, 403);
  });
});
