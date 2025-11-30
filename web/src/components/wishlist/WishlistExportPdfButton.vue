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
import { useAuth } from "../../stores/auth";

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
const auth = useAuth();

const safeItems = computed(() => props.items ?? []);
const familyLabel = computed(() => auth.myFamily?.name || t("my.export.noFamily"));

interface PdfLine {
  text: string;
  size: number;
  lineHeight?: number;
}

function toPdfHex(text: string) {
  const codeUnits: number[] = [0xfeff]; // UTF-16BE BOM
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint > 0xffff) {
      const cp = codePoint - 0x10000;
      codeUnits.push(((cp >> 10) & 0x3ff) + 0xd800); // high surrogate
      codeUnits.push((cp & 0x3ff) + 0xdc00); // low surrogate
    } else {
      codeUnits.push(codePoint);
    }
  }

  return `<${codeUnits
    .map((unit) => unit.toString(16).padStart(4, "0"))
    .join("")}>`;
}

function wrapLines(text: string, maxChars: number): string[] {
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

function buildPdf(lines: PdfLine[]) {
  const pageWidth = 595.28; // A4 in points
  const pageHeight = 841.89;
  const margin = 40;

  const paginated: PdfLine[][] = [[]];
  let current: PdfLine[] = paginated[0]!;
  let currentHeight = 0;
  const maxHeight = pageHeight - margin * 2;

  const getLineHeight = (line: PdfLine) => line.lineHeight ?? Math.max(line.size + 2, 16);

  for (const line of lines) {
    const h = getLineHeight(line);
    if (currentHeight + h > maxHeight) {
      current = [];
      paginated.push(current);
      currentHeight = 0;
    }
    current.push(line);
    currentHeight += h;
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
    let currentY = pageHeight - margin;
    const contentLines = pageLines
      .map((line, lineIndex) => {
        const y = lineIndex === 0 ? currentY : (currentY -= getLineHeight(pageLines[lineIndex - 1]!));
        return `BT /F1 ${line.size} Tf 1 0 0 1 ${margin} ${y.toFixed(2)} Tm ${toPdfHex(
          line.text,
        )} Tj ET`;
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
    const lines: PdfLine[] = [];
    const now = new Date();
    const noValue = t("my.export.none");

    lines.push({
      text: `${t("my.title")} – ${familyLabel.value}`,
      size: 16,
      lineHeight: 22,
    });
    lines.push({ text: t("my.export.generatedAt", { date: now.toLocaleString("fr-FR") }), size: 12 });
    lines.push({ text: t("my.export.subtitle"), size: 12 });
    lines.push({ text: "", size: 8, lineHeight: 12 });

    const maxChars = 72;
    const addWrapped = (label: string, value: string, size = 12) => {
      wrapLines(`${label}: ${value}`, maxChars).forEach((text) =>
        lines.push({ text, size, lineHeight: size + 4 }),
      );
    };

    safeItems.value.forEach((item: WishlistItem, index: number) => {
      const itemTitle = item.original_title || item.title;
      lines.push({ text: `${index + 1}. 🎁 ${itemTitle}`, size: 14, lineHeight: 20 });

      addWrapped(t("my.export.linkLabel"), item.url || noValue);
      addWrapped(
        t("my.export.priceLabel"),
        item.price_eur != null ? fmtEUR.format(item.price_eur) : noValue,
      );
      addWrapped(t("my.export.priorityLabel"), `${item.priority ?? noValue}`);
      addWrapped(t("my.export.notesLabel"), item.notes || noValue);
      if (item.created_at) {
        addWrapped(
          t("my.export.createdLabel"),
          new Date(item.created_at).toLocaleDateString("fr-FR"),
        );
      }

      lines.push({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", size: 10, lineHeight: 16 });
      lines.push({ text: "", size: 8, lineHeight: 12 });
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
