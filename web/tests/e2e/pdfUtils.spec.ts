import { expect, test } from "@playwright/test";
import {
  columnLayout,
  createRenderContext,
  ensureSpace,
  pdfConfig,
} from "../../src/components/wishlist/pdfUtils";

function fakeDoc(width = 595.28, height = 841.89) {
  const calls = { addPage: 0, rect: 0 };
  const doc = {
    internal: { pageSize: { getWidth: () => width, getHeight: () => height } },
    setFillColor: () => doc,
    rect: () => {
      calls.rect += 1;
      return doc;
    },
    addPage: () => {
      calls.addPage += 1;
      return doc;
    },
  };
  return { doc: doc as unknown as Parameters<typeof ensureSpace>[0], calls };
}

test.describe("createRenderContext", () => {
  test("derives layout dimensions from the page size", () => {
    const { doc } = fakeDoc(600, 900);
    const ctx = createRenderContext(doc);

    expect(ctx.margin).toBe(pdfConfig.margin);
    expect(ctx.contentWidth).toBe(600 - pdfConfig.margin * 2);
    expect(ctx.pageHeight).toBe(900);
    expect(ctx.cursorY).toBe(pdfConfig.margin);
  });

  test("paints the paper colour on the first page", () => {
    const { doc, calls } = fakeDoc();
    createRenderContext(doc);

    expect(calls.rect).toBe(1);
  });
});

test.describe("ensureSpace", () => {
  test("keeps the cursor when the page has room", () => {
    const { doc, calls } = fakeDoc();
    const ctx = createRenderContext(doc);
    ctx.cursorY = 100;

    expect(ensureSpace(doc, ctx, 200)).toBe(false);
    expect(calls.addPage).toBe(0);
    expect(ctx.cursorY).toBe(100);
  });

  test("adds a repainted page when it does not", () => {
    const { doc, calls } = fakeDoc();
    const ctx = createRenderContext(doc);
    ctx.cursorY = ctx.pageHeight - ctx.margin - 10;

    expect(ensureSpace(doc, ctx, 50)).toBe(true);
    expect(calls.addPage).toBe(1);
    expect(calls.rect).toBe(2);
    expect(ctx.cursorY).toBe(pdfConfig.margin);
  });
});

test.describe("columnLayout", () => {
  test("lays the four columns out inside the content width", () => {
    const { doc } = fakeDoc();
    const ctx = createRenderContext(doc);
    const layout = columnLayout(ctx);

    expect(layout.photoX).toBe(ctx.margin);
    expect(layout.itemX).toBe(
      ctx.margin + pdfConfig.photoColumn + pdfConfig.columnGap,
    );
    expect(layout.itemWidth).toBeGreaterThan(pdfConfig.photoColumn);
    expect(layout.priorityX + pdfConfig.priorityColumn).toBe(
      ctx.margin + ctx.contentWidth,
    );
  });
});
