import assert from "node:assert/strict";
import test from "node:test";

import { ForbiddenError } from "./errors.js";
import {
  missingWishes,
  refuseWhileListsLocked,
  unlockStatus,
  UnlockSettings,
} from "./unlock-threshold.js";

function createFakeDb({ threshold, wishCount }: { threshold: number; wishCount?: number }) {
  return ((table: string) => {
    if (table === "app_settings") {
      return {
        select() {
          return this;
        },
        async first() {
          return { min_items_to_view: threshold };
        },
      };
    }
    if (table === "wishlist_items as i") {
      if (wishCount === undefined) throw new Error("wishes should not be counted");
      return {
        join() {
          return this;
        },
        where() {
          return this;
        },
        count() {
          return this;
        },
        async first() {
          return { count: String(wishCount) };
        },
      };
    }
    throw new Error(`Unexpected table ${table}`);
  }) as any;
}

test("the missing wishes never go below zero", () => {
  assert.equal(missingWishes(3, 1), 2);
  assert.equal(missingWishes(3, 5), 0);
  assert.equal(missingWishes(0, 0), 0);
});

test("the threshold is a whole number between 0 and 50", () => {
  assert.equal(UnlockSettings.safeParse({ minItemsToView: 3 }).success, true);
  assert.equal(UnlockSettings.safeParse({ minItemsToView: 0 }).success, true);
  assert.equal(UnlockSettings.safeParse({ minItemsToView: -1 }).success, false);
  assert.equal(UnlockSettings.safeParse({ minItemsToView: 1.5 }).success, false);
  assert.equal(UnlockSettings.safeParse({ minItemsToView: 51 }).success, false);
});

test("a threshold of zero unlocks without counting wishes", async () => {
  const status = await unlockStatus(createFakeDb({ threshold: 0 }), "u1", "f1");

  assert.deepEqual(status, { wishesRequired: 0, wishesMissing: 0 });
});

test("the status counts the viewer's own wishes against the threshold", async () => {
  const status = await unlockStatus(
    createFakeDb({ threshold: 3, wishCount: 1 }),
    "u1",
    "f1",
  );

  assert.deepEqual(status, { wishesRequired: 3, wishesMissing: 2 });
});

test("the family's lists stay closed below the threshold", async () => {
  await assert.rejects(
    refuseWhileListsLocked(createFakeDb({ threshold: 2, wishCount: 1 }), "u1", "f1"),
    ForbiddenError,
  );
  await refuseWhileListsLocked(createFakeDb({ threshold: 2, wishCount: 2 }), "u1", "f1");
});
