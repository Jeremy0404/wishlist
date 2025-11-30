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
import Button from "../ui/Button.vue";
import { useI18n } from "vue-i18n";
import { useToasts } from "../ui/useToasts";
import { fmtEUR } from "../../utils/money";

interface WishlistItem {
  id: string;
  title: string;
  original_title?: string;
  url?: string | null;
  price_eur?: number | null;
  notes?: string | null;
  priority?: number | null;
  created_at?: string | null;
}

const props = defineProps<{ items: WishlistItem[] }>();
const exporting = ref(false);
const { push } = useToasts();
const { t } = useI18n();

const safeItems = computed(() => props.items ?? []);

function escapePdf(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLines(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildPdf(lines: string[]) {
  const pageWidth = 595.28; // A4 in points
  const pageHeight = 841.89;
  const margin = 40;
  const lineHeight = 16;
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

  const paginated: string[][] = [[]];
  let current: string[] = paginated[0]!;
  for (const line of lines) {
    if (current.length >= maxLinesPerPage) {
      current = [];
      paginated.push(current);
    }
    current.push(line);
  }

  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let position = 0;

  const pushPart = (text: string) => {
    const bytes = encoder.encode(text);
    parts.push(bytes);
    position += bytes.length;
  };

  pushPart("%PDF-1.4\n");

  const fontObjectId = 3;
  const pageIds: number[] = [];

  const addObject = (id: number, body: string) => {
    offsets[id] = position;
    pushPart(`${id} 0 obj\n${body}\nendobj\n`);
  };

  const contentsStartId = 4;
  paginated.forEach((pageLines, pageIndex) => {
    const yStart = pageHeight - margin;
    const contentLines = pageLines
      .map((text, lineIndex) => {
        const y = yStart - lineIndex * lineHeight;
        return `BT /F1 12 Tf 1 0 0 1 ${margin} ${y.toFixed(2)} Tm (${escapePdf(
          text,
        )}) Tj ET`;
      })
      .join("\n");
    const contentString = `${contentLines}\n`;
    const contentLength = encoder.encode(contentString).length;
    const contentId = contentsStartId + pageIndex * 2;
    const pageId = contentsStartId + pageIndex * 2 + 1;
    pageIds.push(pageId);
    addObject(contentId, `<< /Length ${contentLength} >>\nstream\n${contentString}endstream`);
    const pageBody = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(
      2,
    )} ${pageHeight.toFixed(
      2,
    )}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> >>`;
    addObject(pageId, pageBody);
  });

  addObject(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pagesKids = pageIds.map((id) => `${id} 0 R`).join(" ");
  addObject(2, `<< /Type /Pages /Kids [${pagesKids}] /Count ${pageIds.length} >>`);
  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");

  const totalObjects = 3 + paginated.length * 2;
  const xrefPosition = position;
  pushPart(`xref\n0 ${totalObjects + 1}\n`);
  pushPart("0000000000 65535 f \n");
  for (let i = 1; i <= totalObjects; i++) {
    const offset = offsets[i] ?? 0;
    pushPart(`${offset.toString().padStart(10, "0")} 00000 n \n`);
  }
  pushPart(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`);

  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const buffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    buffer.set(part, offset);
    offset += part.length;
  }

  return buffer;
}

async function exportPdf() {
  if (!safeItems.value.length) return;
  exporting.value = true;
  try {
    const lines: string[] = [];
    const now = new Date();
    lines.push(t("my.title"));
    lines.push(t("my.export.generatedAt", { date: now.toLocaleString() }));
    lines.push("");

    const maxChars = 90;
    safeItems.value.forEach((item: WishlistItem, index: number) => {
      lines.push(`#${index + 1} ${item.original_title || item.title}`);
      wrapLines(`${t("my.form.url")}: ${item.url || "—"}`, maxChars).forEach((l) =>
        lines.push(l),
      );
      wrapLines(
        `${t("my.form.price")}: ${item.price_eur != null ? fmtEUR.format(item.price_eur) : "—"}`,
        maxChars,
      ).forEach((l) => lines.push(l));
      lines.push(`${t("my.form.priority")}: ${item.priority ?? "—"}`);
      wrapLines(`${t("my.form.notes")}: ${item.notes ? item.notes : "—"}`, maxChars).forEach((l) =>
        lines.push(l),
      );
      if (item.created_at) {
        lines.push(
          `${t("common.createdAt", "Créé le")}: ${new Date(item.created_at).toLocaleDateString()}`,
        );
      }
      lines.push("");
    });

    const pdfBytes = buildPdf(lines);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wishlist.pdf";
    a.click();
    URL.revokeObjectURL(url);
    push(t("my.export.success"), "success");
  } catch (e) {
    push(t("my.export.error"), "error");
  } finally {
    exporting.value = false;
  }
}
</script>
