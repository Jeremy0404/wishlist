import type { jsPDF } from "jspdf";
import {
  EM_DASH,
  type ExportColumns,
  type ExportDocument,
} from "./exportDocument";

export type Color = [number, number, number];

/** Organic's tokens flattened over `--color-bg`, since a PDF has no
 *  `color-mix` and no page behind the page. */
export const PAPER = "#f5ead8";

export const palette = {
  bg: [245, 234, 216],
  ink: [32, 30, 29],
  muted: [128, 122, 113],
  divider: [211, 201, 186],
} satisfies Record<string, Color>;

export const pdfConfig = {
  margin: 36,
  markSize: 16,
  headingGap: 30,
  exportedOnGap: 18,
  tableGap: 26,
  columnGap: 12,
  photoColumn: 52,
  priceColumn: 90,
  priorityColumn: 130,
  photoSize: 40,
  rowPadding: 10,
  lineHeight: 15,
  footerGap: 16,
  ruleHeight: 0.75,
};

export type RenderContext = {
  margin: number;
  contentWidth: number;
  pageHeight: number;
  cursorY: number;
};

export type ColumnLayout = {
  photoX: number;
  itemX: number;
  itemWidth: number;
  priceX: number;
  priorityX: number;
};

function paintPage(doc: jsPDF) {
  doc.setFillColor(...palette.bg);
  doc.rect(
    0,
    0,
    doc.internal.pageSize.getWidth(),
    doc.internal.pageSize.getHeight(),
    "F",
  );
}

export function createRenderContext(doc: jsPDF): RenderContext {
  const margin = pdfConfig.margin;
  paintPage(doc);

  return {
    margin,
    contentWidth: doc.internal.pageSize.getWidth() - margin * 2,
    pageHeight: doc.internal.pageSize.getHeight(),
    cursorY: margin,
  };
}

export function ensureSpace(doc: jsPDF, ctx: RenderContext, needed: number) {
  if (ctx.cursorY + needed <= ctx.pageHeight - ctx.margin) return false;

  doc.addPage();
  paintPage(doc);
  ctx.cursorY = ctx.margin;
  return true;
}

export function columnLayout(ctx: RenderContext): ColumnLayout {
  const { photoColumn, priceColumn, priorityColumn, columnGap } = pdfConfig;
  const itemWidth =
    ctx.contentWidth -
    photoColumn -
    priceColumn -
    priorityColumn -
    columnGap * 3;
  const itemX = ctx.margin + photoColumn + columnGap;
  const priceX = itemX + itemWidth + columnGap;

  return {
    photoX: ctx.margin,
    itemX,
    itemWidth,
    priceX,
    priorityX: priceX + priceColumn + columnGap,
  };
}

/** The generator strokes nothing: a rule is a very short filled rectangle. */
function rule(doc: jsPDF, ctx: RenderContext, y: number) {
  doc.setFillColor(...palette.divider);
  doc.rect(ctx.margin, y, ctx.contentWidth, pdfConfig.ruleHeight, "F");
}

function renderHeader(
  doc: jsPDF,
  ctx: RenderContext,
  exportDoc: ExportDocument,
  mark: string | null,
) {
  const margin = ctx.margin;
  const { markSize } = pdfConfig;

  if (mark) {
    doc.addImage(mark, "JPEG", margin, ctx.cursorY, markSize, markSize);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...palette.ink);
  doc.text(
    exportDoc.brand,
    margin + (mark ? markSize + 8 : 0),
    ctx.cursorY + markSize - 3,
  );
  ctx.cursorY += markSize + pdfConfig.headingGap;

  doc.setFontSize(24);
  doc.text(exportDoc.heading, margin, ctx.cursorY);
  ctx.cursorY += pdfConfig.exportedOnGap;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...palette.muted);
  doc.text(exportDoc.exportedOn, margin, ctx.cursorY);
  ctx.cursorY += pdfConfig.tableGap;
}

function bodyFont(doc: jsPDF) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
}

function renderTableHead(
  doc: jsPDF,
  ctx: RenderContext,
  columns: ExportColumns,
) {
  const layout = columnLayout(ctx);
  const [photo, item, price, priority] = columns;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...palette.muted);
  doc.text(photo.toUpperCase(), layout.photoX, ctx.cursorY);
  doc.text(item.toUpperCase(), layout.itemX, ctx.cursorY);
  doc.text(price.toUpperCase(), layout.priceX, ctx.cursorY);
  doc.text(priority.toUpperCase(), layout.priorityX, ctx.cursorY);

  ctx.cursorY += 8;
  rule(doc, ctx, ctx.cursorY);
  ctx.cursorY += pdfConfig.rowPadding;
}

function renderRow(
  doc: jsPDF,
  ctx: RenderContext,
  columns: ExportColumns,
  row: ExportDocument["rows"][number],
) {
  const layout = columnLayout(ctx);
  const { photoSize, lineHeight, rowPadding } = pdfConfig;

  bodyFont(doc);
  const titleLines: string[] = doc.splitTextToSize(row.title, layout.itemWidth);
  const height =
    Math.max(photoSize, titleLines.length * lineHeight) + rowPadding;

  if (ensureSpace(doc, ctx, height + rowPadding)) {
    renderTableHead(doc, ctx, columns);
    bodyFont(doc);
  }

  const top = ctx.cursorY;
  if (row.photoData) {
    doc.addImage(
      row.photoData,
      "JPEG",
      layout.photoX,
      top,
      photoSize,
      photoSize,
    );
  } else {
    doc.setTextColor(...palette.muted);
    doc.text(EM_DASH, layout.photoX, top + lineHeight);
  }

  doc.setTextColor(...palette.ink);
  doc.text(titleLines, layout.itemX, top + lineHeight);
  doc.text(row.price, layout.priceX, top + lineHeight);
  doc.text(row.priority, layout.priorityX, top + lineHeight);

  ctx.cursorY = top + height;
  rule(doc, ctx, ctx.cursorY - rowPadding / 2);
}

function renderFooter(doc: jsPDF, ctx: RenderContext, footer: string) {
  ctx.cursorY += pdfConfig.tableGap;
  ensureSpace(doc, ctx, pdfConfig.footerGap + pdfConfig.lineHeight);
  rule(doc, ctx, ctx.cursorY);
  ctx.cursorY += pdfConfig.footerGap;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...palette.muted);
  doc.text(footer, ctx.margin, ctx.cursorY);
}

export function renderExportPdf(
  doc: jsPDF,
  exportDoc: ExportDocument,
  mark: string | null,
) {
  const ctx = createRenderContext(doc);

  renderHeader(doc, ctx, exportDoc, mark);
  renderTableHead(doc, ctx, exportDoc.columns);
  exportDoc.rows.forEach((row) => renderRow(doc, ctx, exportDoc.columns, row));
  renderFooter(doc, ctx, exportDoc.footer);
}
