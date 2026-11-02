import assert from "node:assert/strict";
import test from "node:test";

import { groupMembersByFamily, type AdminMember } from "./admin.js";

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
