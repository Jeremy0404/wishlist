import { expect, test } from "@playwright/test";
import {
  createRenderContext,
  ensureSpace,
  formatLink,
  pdfConfig,
} from "../../src/components/wishlist/pdfUtils";

test.describe("formatLink", () => {
  const noValue = "(none)";

  test("returns placeholder for empty values", () => {
    expect(formatLink(undefined, noValue)).toBe(noValue);
    expect(formatLink("   ", noValue)).toBe(noValue);
  });

  test("adds https prefix when missing", () => {
    expect(formatLink("example.com/product", noValue)).toBe(
      "https://example.com/product",
    );
  });

  test("preserves existing protocol", () => {
    expect(formatLink("http://foo.test", noValue)).toBe("http://foo.test");
    expect(formatLink("https://bar.test", noValue)).toBe("https://bar.test");
  });
});

test.describe("ensureSpace", () => {
  const baseContext = {
    margin: pdfConfig.margin,
    contentWidth: 500,
    pageHeight: 800,
    cursorY: pdfConfig.margin,
    noValue: "-",
    now: new Date("2024-01-01T00:00:00Z"),
    familyLabel: "Test",
  };

  test("does not add a page when space is sufficient", () => {
    let addedPages = 0;
    const ctx = { ...baseContext, cursorY: 100 };
    const doc = {
      addPage: () => {
        addedPages += 1;
      },
    } as unknown as Parameters<typeof ensureSpace>[0];

    ensureSpace(doc, ctx, 200);

    expect(addedPages).toBe(0);
    expect(ctx.cursorY).toBe(100);
  });

  test("adds a page and resets cursor when space is insufficient", () => {
    let addedPages = 0;
    const ctx = { ...baseContext, cursorY: 760 };
    const doc = {
      addPage: () => {
        addedPages += 1;
      },
    } as unknown as Parameters<typeof ensureSpace>[0];

    ensureSpace(doc, ctx, 50);

    expect(addedPages).toBe(1);
    expect(ctx.cursorY).toBe(pdfConfig.margin);
  });
});

test.describe("createRenderContext", () => {
  test("derives layout dimensions from jsPDF page size", () => {
    const doc = {
      internal: {
        pageSize: {
          getWidth: () => 600,
          getHeight: () => 900,
        },
      },
    } as unknown as Parameters<typeof createRenderContext>[0];

    const now = new Date("2025-02-02T12:00:00Z");
    const ctx = createRenderContext(doc, "Family", "N/A", now);

    expect(ctx.margin).toBe(pdfConfig.margin);
    expect(ctx.contentWidth).toBe(600 - pdfConfig.margin * 2);
    expect(ctx.pageHeight).toBe(900);
    expect(ctx.cursorY).toBe(pdfConfig.margin);
    expect(ctx.familyLabel).toBe("Family");
    expect(ctx.noValue).toBe("N/A");
    expect(ctx.now).toBe(now);
  });
});
