<template>
  <div ref="dropdownRef" class="relative">
    <Button
      variant="ghost"
      data-test="wishlist-export"
      :disabled="!safeItems.length || exporting"
      :loading="exporting"
      @click="toggleDropdown"
    >
      <span class="inline-flex items-center gap-1">
        {{ t("my.export.action") }}
        <svg
          class="h-4 w-4 text-zinc-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </span>
    </Button>

    <div
      v-if="dropdownOpen"
      class="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
    >
      <button
        class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-zinc-100"
        data-test="wishlist-export-pdf"
        :disabled="exporting"
        @click="exportPdf"
      >
        📄 {{ t("my.export.pdf") }}
      </button>
      <button
        class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-zinc-100"
        data-test="wishlist-export-markdown"
        :disabled="exporting"
        @click="exportMarkdown"
      >
        📝 {{ t("my.export.markdown") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
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
const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
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

function closeDropdown() {
  dropdownOpen.value = false;
}

function toggleDropdown() {
  if (!safeItems.value.length || exporting.value) return;
  dropdownOpen.value = !dropdownOpen.value;
}

function onClickOutside(event: MouseEvent) {
  if (!dropdownOpen.value) return;
  const root = dropdownRef.value;
  if (root && event.target instanceof Node && !root.contains(event.target)) {
    closeDropdown();
  }
}

onMounted(() => document.addEventListener("click", onClickOutside));
onUnmounted(() => document.removeEventListener("click", onClickOutside));

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
    t("my.export.itemsCount", { count: safeItems.value.length || noValue }),
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

function downloadText(content: string, filename: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPdf() {
  if (!safeItems.value.length) return;
  exporting.value = true;
  closeDropdown();
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

function toMarkdown(item: WishlistItem, index: number) {
  const title = (item.original_title || item.title || "").trim() || noValue.value;
  const priorityLabel =
    typeof item.priority === "number" ? ` (P${item.priority})` : "";
  const priceValue = item.price_eur == null ? noValue.value : fmtEUR.format(item.price_eur);
  const linkValue = item.url?.trim() || noValue.value;
  const priorityValue = item.priority == null ? noValue.value : `${item.priority}`;
  const notesValue = item.notes?.trim() || noValue.value;
  const createdValue = item.created_at
    ? new Date(item.created_at).toLocaleDateString("fr-FR")
    : noValue.value;

  return `## ${index + 1}. ${title}${priorityLabel}\n` +
    `- ${t("my.export.priceLabel")}: ${priceValue}\n` +
    `- ${t("my.export.linkLabel")}: ${linkValue}\n` +
    `- ${t("my.export.priorityLabel")}: ${priorityValue}\n` +
    `- ${t("my.export.notesLabel")}: ${notesValue}\n` +
    `- ${t("my.export.createdLabel")}: ${createdValue}\n`;
}

function buildMarkdown() {
  const now = new Date();
  const header = [
    `# ${t("my.title")} - ${familyLabel.value}`,
    t("my.export.subtitle"),
    t("my.export.generatedAt", { date: now.toLocaleString("fr-FR") }),
    t("my.export.itemsCount", { count: safeItems.value.length || noValue.value }),
    "",
  ];

  const body = sortedItems.value.map(toMarkdown);
  return [...header, ...body].join("\n\n");
}

async function exportMarkdown() {
  if (!safeItems.value.length) return;
  exporting.value = true;
  closeDropdown();
  try {
    const content = buildMarkdown();
    downloadText(content, "wishlist.md", "text/markdown");
    push(t("my.export.markdownSuccess"), "success");
  } catch (e) {
    console.error(e);
    push(t("my.export.markdownError"), "error");
  } finally {
    exporting.value = false;
  }
}
</script>
