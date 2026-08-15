import { expect, test } from "@playwright/test";
import { buildJoinUrl } from "../../src/utils/buildJoinUrl.ts";
import { fmtEUR } from "../../src/utils/money.ts";
import { toHttpUrl } from "../../src/utils/link.ts";
import { isHighPriority } from "../../src/utils/priority.ts";

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

test.describe("isHighPriority", () => {
  test("maps the 1-5 column onto the two tags, 1 being the highest", () => {
    expect(isHighPriority(1)).toBe(true);
    expect(isHighPriority(2)).toBe(true);
    expect(isHighPriority(3)).toBe(false);
    expect(isHighPriority(5)).toBe(false);
    expect(isHighPriority(null)).toBe(false);
    expect(isHighPriority(undefined)).toBe(false);
  });
});
