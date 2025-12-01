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
import {
  createRenderContext,
  ensureSpace,
  formatLink,
  palette,
  pdfConfig,
} from "./pdfUtils";
import type { Color, RenderContext } from "./pdfUtils";

const props = defineProps<{ items: WishlistItem[] }>();
const exporting = ref(false);
const { push } = useToasts();
const { t } = useI18n();
const auth = useAuth();

const safeItems = computed(() => props.items ?? []);
const sortedItems = computed(() =>
  [...safeItems.value].sort((a, b) => {
    const priorityA = a.priority ?? 6;
    const priorityB = b.priority ?? 6;
    return priorityA - priorityB;
  }),
);
const familyLabel = computed(
  () => auth.myFamily?.name || t("my.export.noFamily"),
);
const noValue = computed(() => t("my.export.none"));

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
    const ctx = createRenderContext(doc, familyLabel.value, noValue.value);

    renderHero(doc, ctx);
    sortedItems.value.forEach((item, index) =>
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
