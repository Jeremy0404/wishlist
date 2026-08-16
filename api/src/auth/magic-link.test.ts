import assert from "node:assert/strict";
import test from "node:test";

import {
  MAGIC_LINK_TTL_MS,
  buildMagicLinkUrl,
  consumeMagicLink,
  displayNameFromEmail,
  findOrCreateUserByEmail,
  hashToken,
  issueMagicLink,
  normalizeEmail,
} from "./magic-link.js";

type Recorded = {
  deleted: Array<Record<string, unknown>>;
  inserted: Array<Record<string, unknown>>;
  where: Array<Record<string, unknown>>;
  whereNull: string[];
  whereOperator: Array<[string, string, unknown]>;
  updated: Array<Record<string, unknown>>;
  returned: string[];
};

function createFakeDb(updatedRows: unknown[] = []) {
  const recorded: Recorded = {
    deleted: [],
    inserted: [],
    where: [],
    whereNull: [],
    whereOperator: [],
    updated: [],
    returned: [],
  };

  const db = (table: string) => {
    if (table !== "magic_link_tokens")
      throw new Error(`Unexpected table ${table}`);

    const query = {
      where(criteria: Record<string, unknown> | string, ...rest: unknown[]) {
        if (typeof criteria === "string") {
          recorded.whereOperator.push([
            criteria,
            rest[0] as string,
            rest[1],
          ]);
        } else {
          recorded.where.push(criteria);
        }
        return this;
      },
      whereNull(column: string) {
        recorded.whereNull.push(column);
        return this;
      },
      async del() {
        recorded.deleted.push(recorded.where[recorded.where.length - 1] ?? {});
        return 1;
      },
      async insert(values: Record<string, unknown>) {
        recorded.inserted.push(values);
        return [values];
      },
      update(values: Record<string, unknown>) {
        recorded.updated.push(values);
        return this;
      },
      async returning(column: string) {
        recorded.returned.push(column);
        return updatedRows;
      },
    };

    return query;
  };

  return { db: db as never, recorded };
}

test("stores only the digest of the emailed token", async () => {
  const { db, recorded } = createFakeDb();

  const token = await issueMagicLink(db, "alexa@example.com");

  const [row] = recorded.inserted;
  assert.equal(row.email, "alexa@example.com");
  assert.equal(row.token_hash, hashToken(token));
  assert.notEqual(row.token_hash, token);
});

test("mints a fresh token on every request", async () => {
  const { db } = createFakeDb();

  const first = await issueMagicLink(db, "alexa@example.com");
  const second = await issueMagicLink(db, "alexa@example.com");

  assert.notEqual(first, second);
});

test("expires the token fifteen minutes after it is issued", async () => {
  const { db, recorded } = createFakeDb();
  const now = new Date("2026-08-16T10:00:00.000Z");

  await issueMagicLink(db, "alexa@example.com", now);

  assert.equal(MAGIC_LINK_TTL_MS, 15 * 60 * 1000);
  assert.deepEqual(
    recorded.inserted[0].expires_at,
    new Date("2026-08-16T10:15:00.000Z"),
  );
});

test("requesting a link drops the address's outstanding ones", async () => {
  const { db, recorded } = createFakeDb();

  await issueMagicLink(db, "alexa@example.com");

  assert.deepEqual(recorded.deleted, [{ email: "alexa@example.com" }]);
});

test("redeeming matches on the digest, unspent and unexpired, in one update", async () => {
  const { db, recorded } = createFakeDb([{ email: "alexa@example.com" }]);
  const now = new Date("2026-08-16T10:05:00.000Z");

  const email = await consumeMagicLink(db, "raw-token", now);

  assert.equal(email, "alexa@example.com");
  assert.deepEqual(recorded.where, [{ token_hash: hashToken("raw-token") }]);
  assert.deepEqual(recorded.whereNull, ["consumed_at"]);
  assert.deepEqual(recorded.whereOperator, [["expires_at", ">", now]]);
  assert.deepEqual(recorded.updated, [{ consumed_at: now }]);
});

test("a token the update does not match yields no address", async () => {
  const { db } = createFakeDb([]);

  assert.equal(await consumeMagicLink(db, "spent-or-expired"), null);
});

test("the emailed link lands on the app, carrying the token", () => {
  process.env.APP_URL = "https://wishlist.example";

  const url = new URL(buildMagicLinkUrl("raw-token"));

  assert.equal(url.origin, "https://wishlist.example");
  assert.equal(url.pathname, "/auth/magic");
  assert.equal(url.searchParams.get("token"), "raw-token");

  delete process.env.APP_URL;
});

test("addresses are compared in one case", () => {
  assert.equal(normalizeEmail("  Alexa@Example.COM "), "alexa@example.com");
});

test("a name is derived from the address the sign-up collected", () => {
  assert.equal(displayNameFromEmail("alexa@example.com"), "Alexa");
  assert.equal(
    displayNameFromEmail("jean-pierre.dupont@example.com"),
    "Jean Pierre Dupont",
  );
});

type FakeUser = { id: string; email: string; name: string };

function createUsersFakeDb(existing: FakeUser[]) {
  const inserted: Array<Record<string, unknown>> = [];

  const db = (table: string) => {
    if (table !== "users") throw new Error(`Unexpected table ${table}`);

    const query = {
      lookup: "",
      select() {
        return this;
      },
      whereRaw(_sql: string, bindings: string[]) {
        this.lookup = bindings[0];
        return this;
      },
      async first() {
        return existing.find((u) => u.email.toLowerCase() === this.lookup);
      },
      insert(values: Record<string, unknown>) {
        inserted.push(values);
        return this;
      },
      async returning(_columns: string[]) {
        const row = inserted[inserted.length - 1];
        return [{ id: "new-user", email: row.email, name: row.name }];
      },
    };

    return query;
  };

  return { db: db as never, inserted };
}

test("an address with no account becomes one, flagged as created", async () => {
  const { db, inserted } = createUsersFakeDb([]);

  const { user, created } = await findOrCreateUserByEmail(
    db,
    "marie.dupont@example.com",
  );

  assert.equal(created, true);
  assert.equal(user.id, "new-user");
  assert.equal(user.name, "Marie Dupont");
  assert.equal(inserted[0].name, "Marie Dupont");
});

test("an address that already has an account is not flagged as created", async () => {
  const { db, inserted } = createUsersFakeDb([
    { id: "existing-user", email: "alexa@example.com", name: "Alexa" },
  ]);

  const { user, created } = await findOrCreateUserByEmail(
    db,
    "alexa@example.com",
  );

  assert.equal(created, false);
  assert.equal(user.id, "existing-user");
  assert.deepEqual(inserted, []);
});
