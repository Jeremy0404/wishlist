import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";

import cookieParser from "cookie-parser";
import express from "express";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { authCookie, signUser } = await import("../auth/jwt.js");
const { errorHandler } = await import("../middleware/error-handler.js");
const { parseAdminEmails } = await import("../middleware/admin.js");
const {
  AccountCreate,
  AccountUpdate,
  createAdminRouter,
  findTakenIdentifier,
  groupMembersByFamily,
  keepsAnIdentifier,
} = await import("./admin.js");
type AdminMember = import("./admin.js").AdminMember;

const ADMIN_ID = "admin-1";
const ADMINS = parseAdminEmails("admin@site.test");

type Row = Record<string, unknown>;

function createUsersDb(rows: Row[]) {
  return ((table: string) => {
    if (table !== "users") throw new Error(`Unexpected table ${table}`);
    let matches = rows;
    return {
      select() {
        return this;
      },
      where(criteria: Row) {
        matches = matches.filter((row) =>
          Object.entries(criteria).every(([key, value]) => row[key] === value),
        );
        return this;
      },
      whereNot(criteria: Row) {
        matches = matches.filter((row) =>
          Object.entries(criteria).some(([key, value]) => row[key] !== value),
        );
        return this;
      },
      async first() {
        return matches[0];
      },
    };
  }) as any;
}

const ADMIN_ROW = { id: ADMIN_ID, email: "admin@site.test", username: null };

async function withAdminServer(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/admin", createAdminRouter(createUsersDb([ADMIN_ROW]), ADMINS));
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

function asAdmin(baseUrl: string, path: string, method: string, body?: unknown) {
  return fetch(`${baseUrl}/admin${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      cookie: `${authCookie.name}=${signUser({ id: ADMIN_ID })}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function member(id: string, family_id: string | null): AdminMember {
  return { id, name: id, email: null, username: id, family_id, wish_count: 0 };
}

test("members are grouped under their family, the family-less apart", () => {
  const grouped = groupMembersByFamily(
    [
      { id: "fam-1", name: "Les Martin" },
      { id: "fam-2", name: "Vide" },
    ],
    [member("ana", "fam-1"), member("bob", null), member("cleo", "fam-1")],
  );

  assert.deepEqual(
    grouped.families.map((f) => ({ id: f.id, members: f.members.map((m) => m.id) })),
    [
      { id: "fam-1", members: ["ana", "cleo"] },
      { id: "fam-2", members: [] },
    ],
  );
  assert.deepEqual(
    grouped.familyless.map((m) => m.id),
    ["bob"],
  );
});

test("an account needs an email or a username", () => {
  const parse = AccountCreate.safeParse({ name: "Mamie", password: "secret1" });

  assert.equal(parse.success, false);
});

test("a username is stored lower-case, a blank email as none", () => {
  const parse = AccountCreate.parse({
    name: "Mamie",
    username: " Mamie.Jo ",
    email: "  ",
    password: "secret1",
  });

  assert.equal(parse.username, "mamie.jo");
  assert.equal(parse.email, null);
});

test("an email is stored lower-case", () => {
  const parse = AccountCreate.parse({
    name: "Mamie",
    email: "Mamie@Site.test",
    password: "secret1",
  });

  assert.equal(parse.email, "mamie@site.test");
});

test("a username with an @ or too short is refused", () => {
  for (const username of ["mamie@site.test", "jo"]) {
    const parse = AccountCreate.safeParse({ name: "Mamie", username, password: "secret1" });
    assert.equal(parse.success, false, username);
  }
});

test("a password shorter than six characters is refused", () => {
  const parse = AccountCreate.safeParse({
    name: "Mamie",
    username: "mamie",
    password: "12345",
  });

  assert.equal(parse.success, false);
});

test("an edit cannot remove the last identifier", () => {
  const current = { email: null, username: "mamie" };

  assert.equal(keepsAnIdentifier(current, AccountUpdate.parse({ username: "" })), false);
  assert.equal(
    keepsAnIdentifier(current, AccountUpdate.parse({ username: "", email: "m@site.test" })),
    true,
  );
  assert.equal(keepsAnIdentifier(current, AccountUpdate.parse({ name: "Jo" })), true);
});

test("an identifier held by another account is reported as taken", async () => {
  const dbConn = createUsersDb([
    { id: "u-1", email: "ana@site.test", username: null },
    { id: "u-2", email: null, username: "bob" },
  ]);

  assert.equal(await findTakenIdentifier(dbConn, { email: "ana@site.test" }), "email");
  assert.equal(await findTakenIdentifier(dbConn, { username: "bob" }), "username");
  assert.equal(await findTakenIdentifier(dbConn, { username: "bob" }, "u-2"), null);
  assert.equal(await findTakenIdentifier(dbConn, { username: "cleo" }), null);
});

test("creating an account without an identifier is refused before any write", async () => {
  await withAdminServer(async (baseUrl) => {
    const res = await asAdmin(baseUrl, "/users", "POST", {
      name: "Mamie",
      password: "secret1",
    });

    assert.equal(res.status, 400);
  });
});

test("setting a too-short password is refused", async () => {
  await withAdminServer(async (baseUrl) => {
    const res = await asAdmin(baseUrl, "/users/u-1/password", "PUT", {
      password: "123",
    });

    assert.equal(res.status, 400);
  });
});

test("the admin cannot delete their own account", async () => {
  await withAdminServer(async (baseUrl) => {
    const res = await asAdmin(baseUrl, `/users/${ADMIN_ID}`, "DELETE");

    assert.equal(res.status, 409);
  });
});
