<template>
  <Button
    variant="ghost"
    data-test="wishlist-export"
    :disabled="!items.length || exporting"
    :loading="exporting"
    @click="exportPdf"
  >
    {{ t("my.export.pdf") }}
  </Button>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { jsPDF } from "jspdf";
import Button from "../ui/Button.vue";
import { useToasts } from "../ui/useToasts";
import { fmtEUR } from "../../utils/money";
import { useAuth } from "../../stores/auth";
import type { WishlistItem } from "../../types.ts";

type Color = [number, number, number];

type Palette = {
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

const palette: Palette = {
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

const pdfConfig = {
  margin: 36,
  heroHeight: 92,
  heroSpacing: 18,
  cardSpacing: 6,
  cardTitleHeight: 26,
};

type RenderContext = {
  margin: number;
  contentWidth: number;
  pageHeight: number;
  cursorY: number;
  noValue: string;
  now: Date;
  familyLabel: string;
};

const props = defineProps<{ items: WishlistItem[] }>();
const exporting = ref(false);
const { push } = useToasts();
const { t } = useI18n();
const auth = useAuth();

const safeItems = computed(() => props.items ?? []);
const familyLabel = computed(
  () => auth.myFamily?.name || t("my.export.noFamily"),
);

function createRenderContext(doc: jsPDF, family: string): RenderContext {
  const margin = pdfConfig.margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  return {
    margin,
    contentWidth,
    pageHeight,
    cursorY: margin,
    noValue: t("my.export.none"),
    now: new Date(),
    familyLabel: family,
  };
}

function ensureSpace(doc: jsPDF, ctx: RenderContext, needed: number) {
  if (ctx.cursorY + needed > ctx.pageHeight - ctx.margin) {
    doc.addPage();
    ctx.cursorY = ctx.margin;
  }
}

function formatLink(url: string | null | undefined, noValue: string) {
  if (!url) return noValue;
  const trimmed = url.trim();
  if (!trimmed) return noValue;
  const hasProtocol = /^https?:\/\//i.test(trimmed);
  return hasProtocol ? trimmed : `https://${trimmed}`;
}

function renderHero(doc: jsPDF, ctx: RenderContext) {
  const { margin, contentWidth, noValue, now } = ctx;
  const heroHeight = pdfConfig.heroHeight;
  ensureSpace(doc, ctx, heroHeight + 12);
  doc.setFillColor(...palette.heroBg);
  doc.roundedRect(margin, ctx.cursorY, contentWidth, heroHeight, 8, 8, "F");
  doc.setTextColor(...palette.heroTitle);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(
    `${t("my.title")} - ${ctx.familyLabel}`.toUpperCase(),
    margin + 14,
    ctx.cursorY + 26,
  );

  doc.setTextColor(...palette.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(t("my.export.subtitle"), margin + 14, ctx.cursorY + 46);

  doc.setTextColor(...palette.heroAccent);
  doc.setFontSize(11);
  doc.text(
    t("my.export.generatedAt", { date: now.toLocaleString("fr-FR") }),
    margin + 14,
    ctx.cursorY + 64,
  );
  doc.text(
    `Articles : ${safeItems.value.length || noValue}`,
    margin + 14,
    ctx.cursorY + 80,
  );

  ctx.cursorY += heroHeight + pdfConfig.heroSpacing;
}

function renderTitle(
  doc: jsPDF,
  ctx: RenderContext,
  text: string,
  background: Color,
) {
  const height = pdfConfig.cardTitleHeight + 6;
  ensureSpace(doc, ctx, height);
  doc.setFillColor(...background);
  doc.roundedRect(ctx.margin, ctx.cursorY, ctx.contentWidth, height, 8, 8, "F");
  doc.setTextColor(...palette.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(text, ctx.margin + 14, ctx.cursorY + 18);
  ctx.cursorY += height + 6;
}

function renderDetail(
  doc: jsPDF,
  ctx: RenderContext,
  label: string,
  value: string,
  options: {
    color?: Color;
    labelColor?: Color;
    fontSize?: number;
  } = {},
) {
  const color = options.color ?? palette.text;
  const labelColor = options.labelColor ?? palette.muted;
  const fontSize = options.fontSize ?? 11;
  const textLines = doc.splitTextToSize(
    value || ctx.noValue,
    ctx.contentWidth - 60,
  );
  const height = 14 + textLines.length * 14;
  ensureSpace(doc, ctx, height);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...labelColor);
  doc.text(label.toUpperCase(), ctx.margin + 14, ctx.cursorY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  doc.text(textLines, ctx.margin + 14, ctx.cursorY + 24);
  ctx.cursorY += height;
}

function renderItemCard(
  doc: jsPDF,
  ctx: RenderContext,
  item: WishlistItem,
  index: number,
) {
  const cardBg = index % 2 === 0 ? palette.cardA : palette.cardB;
  ensureSpace(doc, ctx, 30);

  // Header
  const displayTitle =
    (item.original_title || item.title || "").trim() || ctx.noValue;
  const priorityBadge =
    typeof item.priority === "number" ? `P${item.priority}` : "";
  renderTitle(
    doc,
    ctx,
    `#${index + 1} ${displayTitle} ${priorityBadge}`,
    cardBg,
  );

  // Details
  const priceValue =
    item.price_eur == null ? ctx.noValue : fmtEUR.format(item.price_eur);
  renderDetail(doc, ctx, t("my.export.priceLabel"), priceValue, {
    color: palette.accent,
    labelColor: palette.text,
    fontSize: 13,
  });
  renderDetail(
    doc,
    ctx,
    t("my.export.linkLabel"),
    formatLink(item.url, ctx.noValue),
    { color: palette.link, labelColor: palette.link, fontSize: 12 },
  );
  renderDetail(
    doc,
    ctx,
    t("my.export.priorityLabel"),
    `${item.priority ?? ctx.noValue}`,
    { color: palette.text },
  );
  renderDetail(doc, ctx, t("my.export.notesLabel"), item.notes || ctx.noValue, {
    color: palette.notes,
  });
  if (item.created_at) {
    renderDetail(
      doc,
      ctx,
      t("my.export.createdLabel"),
      new Date(item.created_at).toLocaleDateString("fr-FR"),
      { color: palette.muted },
    );
  }

  // Spacer between cards
  ctx.cursorY += pdfConfig.cardSpacing + 8;
}

function downloadDoc(doc: jsPDF) {
  const blob = doc.output("blob") as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wishlist.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPdf() {
  if (!safeItems.value.length) return;
  exporting.value = true;
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const ctx = createRenderContext(doc, familyLabel.value);

    renderHero(doc, ctx);
    safeItems.value.forEach((item, index) =>
      renderItemCard(doc, ctx, item, index),
    );
    downloadDoc(doc);
    push(t("my.export.success"), "success");
  } catch (e) {
    console.error(e);
    push(t("my.export.error"), "error");
  } finally {
    exporting.value = false;
  }
}
</script>
