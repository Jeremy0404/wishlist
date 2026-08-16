import assert from "node:assert/strict";
import test from "node:test";

import {
  detectImageExtension,
  isLinkedImage,
  isStoredImage,
} from "./uploads.js";

function bytes(...values: number[]) {
  return Buffer.from(values);
}

test("the extension comes from the magic bytes, not the claimed name", () => {
  assert.equal(
    detectImageExtension(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
    "png",
  );
  assert.equal(detectImageExtension(bytes(0xff, 0xd8, 0xff, 0xe0)), "jpg");
  assert.equal(detectImageExtension(Buffer.from("GIF89a....", "ascii")), "gif");
  assert.equal(
    detectImageExtension(Buffer.from("RIFF    WEBPVP8 ", "ascii")),
    "webp",
  );
});

test("anything that is not an accepted image is rejected", () => {
  assert.equal(detectImageExtension(Buffer.from("%PDF-1.7", "ascii")), null);
  assert.equal(detectImageExtension(Buffer.from("<svg />", "ascii")), null);
  assert.equal(detectImageExtension(Buffer.alloc(0)), null);
  assert.equal(
    detectImageExtension(Buffer.from("RIFFxxxxWAVEfmt ", "ascii")),
    null,
  );
});

test("only generated names count as a stored image", () => {
  const name = "a".repeat(32);
  assert.equal(isStoredImage(`/uploads/${name}.png`), true);
  assert.equal(isStoredImage(`/uploads/${name}.webp`), true);
  assert.equal(isStoredImage("/uploads/../../etc/passwd"), false);
  assert.equal(isStoredImage(`/uploads/${name}.svg`), false);
  assert.equal(isStoredImage("/uploads/photo.png"), false);
  assert.equal(isStoredImage(`/uploads/sub/${name}.png`), false);
});

test("a linked image has to be http or https", () => {
  assert.equal(isLinkedImage("https://cdn.example/photo.jpg"), true);
  assert.equal(isLinkedImage("http://cdn.example/photo.jpg"), true);
  assert.equal(isLinkedImage("javascript:alert(1)"), false);
  assert.equal(isLinkedImage("data:image/png;base64,AAAA"), false);
  assert.equal(isLinkedImage("/uploads/photo.png"), false);
});
