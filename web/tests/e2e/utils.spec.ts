import { expect, test } from "@playwright/test";
import { buildJoinUrl } from "../../src/utils/buildJoinUrl.ts";
import { fmtEUR } from "../../src/utils/money.ts";
import { toHttpUrl } from "../../src/utils/link.ts";
import { priorityLevel } from "../../src/utils/priority.ts";

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

test.describe("priorityLevel", () => {
  test("maps the 1-5 column onto the three levels, 1 being the highest", () => {
    expect(priorityLevel(1)).toBe("high");
    expect(priorityLevel(2)).toBe("medium");
    expect(priorityLevel(3)).toBe("low");
  });

  test("shows legacy 4 and 5 as the lowest level", () => {
    expect(priorityLevel(4)).toBe("low");
    expect(priorityLevel(5)).toBe("low");
  });

  test("has no level when the item carries no priority", () => {
    expect(priorityLevel(null)).toBeNull();
    expect(priorityLevel(undefined)).toBeNull();
  });
});
