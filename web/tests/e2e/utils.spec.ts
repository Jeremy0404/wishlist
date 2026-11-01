import { expect, test } from "@playwright/test";
import { buildJoinUrl } from "../../src/utils/buildJoinUrl.ts";
import { fmtEUR } from "../../src/utils/money.ts";
import { toHttpUrl } from "../../src/utils/link.ts";
import { isFavorite, priorityFor } from "../../src/utils/favorite.ts";

test.describe("buildJoinUrl", () => {
  test("sets join path and invite code while preserving other params", () => {
    const result = buildJoinUrl(
      "NEWCODE",
      "https://example.org/foo?code=old&ref=1",
    );
    const url = new URL(result);

    expect(url.pathname).toBe("/family/join");
    expect(url.searchParams.get("code")).toBe("NEWCODE");
    expect(url.searchParams.get("ref")).toBe("1");
  });

  test("removes existing code when no invite provided", () => {
    const result = buildJoinUrl("", "https://example.org/family/join?code=abc");
    const url = new URL(result);

    expect(url.searchParams.has("code")).toBeFalsy();
  });

  test("falls back to default origin when no base URL is provided", () => {
    const url = new URL(buildJoinUrl("ZZZ"));

    expect(url.origin).toBe("https://example.com");
    expect(url.pathname).toBe("/family/join");
    expect(url.searchParams.get("code")).toBe("ZZZ");
  });
});

test.describe("fmtEUR", () => {
  test("formats amounts using French Euro locale", () => {
    expect(fmtEUR.format(1234.5)).toBe("1 234,50 €");
  });

  test("handles zero and integer values", () => {
    expect(fmtEUR.format(0)).toBe("0,00 €");
    expect(fmtEUR.format(42)).toBe("42,00 €");
  });
});

test.describe("toHttpUrl", () => {
  test("accepts an http or https link, trimmed", () => {
    expect(toHttpUrl("  https://shop.example/p/1  ")).toBe(
      "https://shop.example/p/1",
    );
    expect(toHttpUrl("http://shop.example")).toBe("http://shop.example");
  });

  test("rejects plain text and anything that is not http", () => {
    expect(toHttpUrl("plaid tout doux")).toBeNull();
    expect(toHttpUrl("shop.example/p/1")).toBeNull();
    expect(toHttpUrl("javascript:alert(1)")).toBeNull();
    expect(toHttpUrl("")).toBeNull();
  });
});

test.describe("coup de cœur", () => {
  test("only priority 1 is a coup de cœur", () => {
    expect(isFavorite(1)).toBe(true);
    for (const priority of [2, 3, 4, 5, null, undefined]) {
      expect(isFavorite(priority)).toBe(false);
    }
  });

  test("the toggle writes 1, or a plain 3", () => {
    expect(priorityFor(true)).toBe(1);
    expect(priorityFor(false)).toBe(3);
  });
});
