import assert from "node:assert/strict";
import test from "node:test";

import { generateInviteCode } from "./family.js";

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
