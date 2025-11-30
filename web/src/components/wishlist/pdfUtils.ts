import type { jsPDF } from "jspdf";

export type Color = [number, number, number];

export type Palette = {
  heroBg: Color;
  heroTitle: Color;
  heroMeta: Color;
  heroAccent: Color;
  cardA: Color;
  cardB: Color;
  link: Color;
  notes: Color;
  muted: Color;
  accent: Color;
  text: Color;
};

export const palette: Palette = {
  heroBg: [240, 245, 255],
  heroTitle: [31, 41, 55],
  heroMeta: [99, 115, 129],
  heroAccent: [18, 116, 152],
  cardA: [255, 255, 255],
  cardB: [245, 248, 252],
  link: [23, 105, 170],
  notes: [71, 85, 99],
  muted: [120, 130, 140],
  accent: [24, 144, 180],
  text: [45, 55, 72],
};

export const pdfConfig = {
  margin: 36,
  heroHeight: 92,
  heroSpacing: 18,
  cardSpacing: 6,
  cardTitleHeight: 26,
};

export type RenderContext = {
  margin: number;
  contentWidth: number;
  pageHeight: number;
  cursorY: number;
  noValue: string;
  now: Date;
  familyLabel: string;
};

export function createRenderContext(
  doc: jsPDF,
  family: string,
  noValue: string,
  now: Date = new Date(),
): RenderContext {
  const margin = pdfConfig.margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  return {
    margin,
    contentWidth,
    pageHeight,
    cursorY: margin,
    noValue,
    now,
    familyLabel: family,
  };
}

export function ensureSpace(doc: jsPDF, ctx: RenderContext, needed: number) {
  if (ctx.cursorY + needed > ctx.pageHeight - ctx.margin) {
    doc.addPage();
    ctx.cursorY = ctx.margin;
  }
}

export function formatLink(url: string | null | undefined, noValue: string) {
  if (!url) return noValue;
  const trimmed = url.trim();
  if (!trimmed) return noValue;
  const hasProtocol = /^https?:\/\//i.test(trimmed);
  return hasProtocol ? trimmed : `https://${trimmed}`;
}
