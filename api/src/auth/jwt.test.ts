import assert from "node:assert/strict";
import test from "node:test";

import jwt from "jsonwebtoken";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { signUser, verifyToken } = await import("./jwt.js");

test("a session carries the user id only", () => {
  const payload = jwt.decode(signUser({ id: "user-1" })) as Record<string, unknown>;

  assert.equal(payload.id, "user-1");
  assert.equal("email" in payload, false);
});

test("a session from before usernames, carrying an email, still verifies", () => {
  const legacy = jwt.sign(
    { id: "user-1", email: "alexa@example.com" },
    process.env.JWT_SECRET!,
  );

  assert.equal(verifyToken(legacy)?.id, "user-1");
});

test("a token without a user id is refused", () => {
  const token = jwt.sign({ email: "alexa@example.com" }, process.env.JWT_SECRET!);

  assert.equal(verifyToken(token), null);
});
