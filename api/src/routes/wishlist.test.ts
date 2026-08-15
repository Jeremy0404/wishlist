import assert from "node:assert/strict";
import test from "node:test";

import { listFamilyWishlists } from "./wishlist.js";

type Recorded = {
  where: Array<[string, string]>;
  andWhereNot: Array<[string, string]>;
  selected: string[];
  raw: Array<{ sql: string; bindings: unknown[] }>;
  orderBy: Array<[string, string]>;
};

function createFakeDb(rows: unknown[] = []) {
  const recorded: Recorded = {
    where: [],
    andWhereNot: [],
    selected: [],
    raw: [],
    orderBy: [],
  };

  const db = (table: string) => {
    if (table !== "wishlists as w") throw new Error(`Unexpected table ${table}`);

    const query = {
      join() {
        return this;
      },
      where(column: string, value: string) {
        recorded.where.push([column, value]);
        return this;
      },
      andWhereNot(column: string, value: string) {
        recorded.andWhereNot.push([column, value]);
        return this;
      },
      select(...columns: unknown[]) {
        for (const column of columns) {
          if (typeof column === "string") recorded.selected.push(column);
        }
        return this;
      },
      async orderBy(column: string, direction: string) {
        recorded.orderBy.push([column, direction]);
        return rows;
      },
    };

    return query;
  };

  db.raw = (sql: string, bindings: unknown[] = []) => {
    recorded.raw.push({ sql, bindings });
    return { sql, bindings };
  };

  return { db: db as never, recorded };
}

test("excludes the caller's own wishlist from the family listing", async () => {
  const { db, recorded } = createFakeDb();

  await listFamilyWishlists(db, "family-1", "user-1");

  assert.deepEqual(recorded.where, [["w.family_id", "family-1"]]);
  assert.deepEqual(recorded.andWhereNot, [["w.user_id", "user-1"]]);
});

test("counts items and reservations in the query rather than in memory", async () => {
  const { db, recorded } = createFakeDb();

  await listFamilyWishlists(db, "family-1", "user-1");

  const [itemCount, reservedByMe] = recorded.raw;

  assert.match(itemCount.sql, /count\(\*\)[\s\S]*wishlist_items/);
  assert.match(itemCount.sql, /as item_count/);
  assert.deepEqual(itemCount.bindings, []);

  assert.match(reservedByMe.sql, /count\(\*\)[\s\S]*reservations/);
  assert.match(reservedByMe.sql, /as reserved_by_me_count/);
});

test("scopes the reserved count to the caller and nobody else", async () => {
  const { db, recorded } = createFakeDb();

  await listFamilyWishlists(db, "family-1", "user-1");

  const reservedByMe = recorded.raw[1];

  assert.match(reservedByMe.sql, /r\.reserver_user_id = \?/);
  assert.deepEqual(reservedByMe.bindings, ["user-1"]);
});

test("selects no reservation column beyond the caller's own count", async () => {
  const { db, recorded } = createFakeDb();

  await listFamilyWishlists(db, "family-1", "user-1");

  assert.deepEqual(recorded.selected, [
    "w.id as wishlist_id",
    "u.id as user_id",
    "u.name",
    "w.created_at",
  ]);
  assert.equal(recorded.raw.length, 2);
});

test("orders the listing by owner name", async () => {
  const { db, recorded } = createFakeDb();

  await listFamilyWishlists(db, "family-1", "user-1");

  assert.deepEqual(recorded.orderBy, [["u.name", "asc"]]);
});
