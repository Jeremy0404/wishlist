import assert from "node:assert/strict";
import test from "node:test";

import { buildShareSlug, slugifyOwnerName } from "./share-slug.js";

const SLUG = /^[a-z0-9-]+-[a-z2-9]{4}$/;

test("builds a readable slug out of the owner name and a short token", () => {
  const slug = buildShareSlug("Alexa");

  assert.match(slug, SLUG);
  assert.ok(slug.startsWith("alexa-"));
});

test("strips accents and punctuation from the owner name", () => {
  assert.equal(slugifyOwnerName("Élodie Martin"), "elodie-martin");
  assert.equal(slugifyOwnerName("Jean-Luc  O'Connor"), "jean-luc-o-connor");
});

test("falls back to a generic prefix when the name has nothing usable", () => {
  assert.equal(slugifyOwnerName("陳"), "liste");
  assert.equal(slugifyOwnerName(""), "liste");
});

test("truncates a long name without leaving a trailing separator", () => {
  const slug = slugifyOwnerName("Marie Anne Charlotte de la Fontaine");

  assert.equal(slug, "marie-anne-charlotte-de");
  assert.ok(!slug.endsWith("-"));
});

test("keeps the name prefix stable and the token unpredictable", () => {
  const slugs = new Set(
    Array.from({ length: 50 }, () => buildShareSlug("Alexa")),
  );

  assert.equal(slugs.size, 50);
  for (const slug of slugs) assert.match(slug, /^alexa-[a-z2-9]{4}$/);
});

test("keeps ambiguous characters out of the token", () => {
  const tokens = Array.from({ length: 200 }, () =>
    buildShareSlug("x").slice(2),
  );

  for (const token of tokens) assert.doesNotMatch(token, /[lo01]/);
});
