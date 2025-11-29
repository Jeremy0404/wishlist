import assert from "node:assert/strict";
import test from "node:test";

import { generateInviteCode, listFamilyMembers } from "./family.js";

type FakeDbDeps = {
  hasMembershipCreatedAt: boolean;
  users: Array<{ id: string; name: string; created_at: Date }>;
  memberships: Array<{
    user_id: string;
    family_id: string;
    role: string;
    created_at?: Date;
  }>;
};

function createFakeDb({ hasMembershipCreatedAt, users, memberships }: FakeDbDeps) {
  const raw = (sql: string, bindings: string[]) => ({ sql, bindings });

  const orderByFields: string[] = [];

  const db = (table: string) => {
    if (table !== "family_memberships as fm") throw new Error(`Unexpected table ${table}`);

    const query = {
      familyId: "",
      join() {
        return this;
      },
      select() {
        return this;
      },
      where(_col: string, familyId: string) {
        this.familyId = familyId;
        return this;
      },
      async orderBy(orderByField: string, direction: string) {
        if (direction !== "asc") throw new Error("Only asc is implemented in fake db");

        orderByFields.push(orderByField);

        const filtered = memberships.filter((m) => m.family_id === this.familyId);

        const joined = filtered.map((membership) => {
          const user = users.find((u) => u.id === membership.user_id);
          if (!user) throw new Error("Missing user in fake db");

          const joined_at =
            hasMembershipCreatedAt && membership.created_at
              ? membership.created_at
              : user.created_at;

          return {
            id: user.id,
            name: user.name,
            role: membership.role,
            joined_at,
          };
        });

        return joined.sort((a, b) => a.joined_at.getTime() - b.joined_at.getTime());
      },
    };

    return query;
  };

  db.schema = {
    async hasColumn(table: string, column: string) {
      return hasMembershipCreatedAt && table === "family_memberships" && column === "created_at";
    },
  } as any;

  db.raw = raw as any;

  return { db: db as any, orderByFields };
}

test("generates a code with sanitized uppercase prefix and random suffix", () => {
  const code = generateInviteCode("Élodie Fam!");

  assert.match(code, /^[A-Z]{3}-[A-Z0-9]{6}$/);
  assert.equal(code.slice(0, 3), "ELO");
});

test("pads prefixes shorter than three characters", () => {
  const code = generateInviteCode("ab");

  assert.equal(code.slice(0, 3), "ABX");
});

test("produces different codes across calls", () => {
  const first = generateInviteCode("Family");
  const second = generateInviteCode("Family");

  assert.notEqual(first, second);
});

test("lists members ordered by membership created_at when column exists", async () => {
  const { db: fakeDb, orderByFields } = createFakeDb({
    hasMembershipCreatedAt: true,
    users: [
      { id: "user-1", name: "Alice", created_at: new Date("2024-01-01T00:00:00Z") },
      { id: "user-2", name: "Bob", created_at: new Date("2024-01-02T00:00:00Z") },
    ],
    memberships: [
      {
        user_id: "user-1",
        family_id: "family-1",
        role: "admin",
        created_at: new Date("2024-02-01T00:00:00Z"),
      },
      {
        user_id: "user-2",
        family_id: "family-1",
        role: "member",
        created_at: new Date("2024-01-15T00:00:00Z"),
      },
    ],
  });

  const members = await listFamilyMembers(fakeDb, "family-1");

  assert.deepEqual(
    members.map((m) => ({ id: m.id, joined_at: m.joined_at.toISOString() })),
    [
      { id: "user-2", joined_at: "2024-01-15T00:00:00.000Z" },
      { id: "user-1", joined_at: "2024-02-01T00:00:00.000Z" },
    ],
  );

  assert.deepEqual(orderByFields, ["fm.created_at"]);
});

test("falls back to user created_at when membership timestamp is missing", async () => {
  const { db: fakeDb, orderByFields } = createFakeDb({
    hasMembershipCreatedAt: false,
    users: [
      { id: "user-1", name: "Alice", created_at: new Date("2024-02-01T00:00:00Z") },
      { id: "user-2", name: "Bob", created_at: new Date("2024-01-01T00:00:00Z") },
    ],
    memberships: [
      { user_id: "user-1", family_id: "family-1", role: "member" },
      { user_id: "user-2", family_id: "family-1", role: "admin" },
    ],
  });

  const members = await listFamilyMembers(fakeDb, "family-1");

  assert.deepEqual(
    members.map((m) => ({ id: m.id, joined_at: m.joined_at.toISOString() })),
    [
      { id: "user-2", joined_at: "2024-01-01T00:00:00.000Z" },
      { id: "user-1", joined_at: "2024-02-01T00:00:00.000Z" },
    ],
  );

  assert.deepEqual(orderByFields, ["u.created_at"]);
});
