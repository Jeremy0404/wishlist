import assert from "node:assert/strict";
import test from "node:test";

import { magicLinkEmail } from "./magic-link-email.js";

const URL_ = "https://wishlist.example/auth/magic?token=raw-token";

test("resolves every design token to a literal, since clients strip variables", () => {
  const { html } = magicLinkEmail("alexa@example.com", URL_);

  assert.doesNotMatch(html, /var\(--/);
  assert.match(html, /#c67139/);
});

test("carries no remote image", () => {
  const { html } = magicLinkEmail("alexa@example.com", URL_);

  assert.doesNotMatch(html, /<img/i);
  assert.doesNotMatch(html, /https?:\/\/(?!wishlist\.example)/);
});

test("names the fifteen-minute, single-use policy the token enforces", () => {
  const { text, html } = magicLinkEmail("alexa@example.com", URL_);

  for (const body of [text, html]) {
    assert.match(body, /15 minutes/);
    assert.match(body, /une seule fois/);
  }
});

test("offers the link as a button and as copyable text", () => {
  const { html, text } = magicLinkEmail("alexa@example.com", URL_);

  assert.match(html, new RegExp(`href="${URL_.replace(/\?/, "\\?")}"`));
  assert.equal(html.split(URL_).length - 1, 2);
  assert.match(text, /https:\/\/wishlist\.example\/auth\/magic\?token=raw-token/);
});

test("falls back to system fonts, which is what most clients will use", () => {
  const { html } = magicLinkEmail("alexa@example.com", URL_);

  assert.match(html, /Georgia/);
  assert.match(html, /Figtree, -apple-system, 'Segoe UI', Arial/);
});
