<template>
  <div class="flex items-center justify-between gap-3 mb-4">
    <h1 class="text-xl font-semibold">{{ t("my.title") }}</h1>
    <Button
      variant="ghost"
      data-test="wishlist-export"
      :disabled="items.length === 0 || exporting"
      :loading="exporting"
      @click="exportPdf"
    >
      {{ t("my.export.pdf") }}
    </Button>
  </div>

  <Card class="mb-4">
    <template #header
      ><h2 class="font-semibold">{{ t("my.addTitle") }}</h2></template
    >
    <form @submit.prevent="add" class="grid gap-3 sm:grid-cols-2">
      <Input
        v-model="form.title"
        name="title"
        data-test="item-title"
        :label="t('my.form.title')"
        required
      />
      <Input
        v-model="form.url"
        name="url"
        data-test="item-url"
        :label="t('my.form.url')"
      />
      <Input
        v-model.number="form.price_eur"
        name="price_eur"
        data-test="item-price"
        type="number"
        step="5"
        min="0"
        :max="1000000"
        :label="t('my.form.price')"
      />

      <Input
        v-model.number="form.priority"
        name="priority"
        data-test="item-priority"
        type="number"
        :label="t('my.form.priority')"
      />
      <div class="sm:col-span-2">
        <label class="block text-sm mb-1" for="notes">{{
          t("my.form.notes")
        }}</label>
        <textarea
          v-model="form.notes"
          name="notes"
          data-test="item-notes"
          rows="3"
          class="w-full rounded-lg border-zinc-300 bg-white text-sm focus:ring-brand-500 focus:border-brand-500"
          placeholder="Notes"
        ></textarea>
      </div>
      <div class="sm:col-span-2">
        <Button
          variant="primary"
          type="submit"
          data-test="wishlist-add-submit"
          :loading="submitting"
          >{{ t("my.addBtn") }}</Button
        >
      </div>
    </form>
  </Card>

  <div v-if="items.length === 0" class="text-zinc-600">
    {{ t("my.empty") }}
  </div>

  <ul class="grid gap-3">
    <li
      v-for="it in items"
      :key="it.id"
      data-test="wishlist-item"
      :data-title="it.original_title || it.title"
      :data-id="it.id"
    >
      <WishlistItemEditor
        v-if="editingId === it.id"
        :initial-item="it"
        :loading="editSubmitting"
        @save="(payload) => saveEdit(it.id, payload)"
        @cancel="cancelEdit"
      />
      <WishlistItemCard
        v-else
        :item="it"
        @edit="beginEdit(it)"
        @delete="removeItem(it.id)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { api } from "../services/api";
import Card from "../components/ui/Card.vue";
import Button from "../components/ui/Button.vue";
import Input from "../components/ui/Input.vue";
import { useToasts } from "../components/ui/useToasts";
import { useI18n } from "vue-i18n";
import WishlistItemCard from "../components/wishlist/WishlistItemCard.vue";
import WishlistItemEditor from "../components/wishlist/WishlistItemEditor.vue";
import { fmtEUR } from "../utils/money";

const { push } = useToasts();
const { t } = useI18n();

interface WishlistItemForm {
  title: string;
  url?: string;
  price_eur?: number;
  notes?: string;
  priority?: number;
}

const items = ref<any[]>([]);
const submitting = ref(false);
const editSubmitting = ref(false);
const exporting = ref(false);
const form = reactive({
  title: "",
  url: "",
  price_eur: undefined as number | undefined,
  notes: "",
  priority: 3,
});
const editingId = ref<string | null>(null);

function normalizeItem(item: any) {
  return { ...item, original_title: item.original_title ?? item.title };
}

async function load() {
  const data = await api.getMyWishlist();
  items.value = (data.items ?? []).map(normalizeItem);
}

async function add() {
  submitting.value = true;
  try {
    const created = await api.addMyItem({
      title: form.title || "",
      url: form.url || undefined,
      price_eur: form.price_eur,
      notes: form.notes || undefined,
      priority: form.priority,
    });

    items.value.unshift(normalizeItem(created));
    form.title = "";
    form.url = "";
    form.price_eur = undefined;
    form.notes = "";
    form.priority = 3;
    push(t("toast.added"), "success");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    submitting.value = false;
  }
}

async function removeItem(id: string) {
  await api.deleteMyItem(id);
  items.value = items.value.filter((i) => i.id !== id);
  push(t("toast.removed"), "info");
}

function beginEdit(item: any) {
  editingId.value = item.id;
}

function cancelEdit() {
  editingId.value = null;
  editSubmitting.value = false;
}

async function saveEdit(id: string, form: WishlistItemForm) {
  if (!form.title?.trim()) {
    push(t("my.validation.titleRequired"), "error");
    return;
  }

  editingId.value = id;
  editSubmitting.value = true;
  try {
    const updated = await api.updateMyItem(id, {
      title: form.title.trim(),
      url: form.url || undefined,
      price_eur: form.price_eur,
      notes: form.notes || undefined,
      priority: form.priority,
    });
    items.value = items.value.map((it) =>
      it.id === id
        ? normalizeItem({ ...it, ...updated, original_title: it.original_title })
        : it,
    );
    push(t("toast.updated"), "success");
    cancelEdit();
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    editSubmitting.value = false;
  }
}

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
  if (!items.value.length) return;
  exporting.value = true;
  try {
    const lines: string[] = [];
    const now = new Date();
    lines.push(t("my.title"));
    lines.push(t("my.export.generatedAt", { date: now.toLocaleString() }));
    lines.push("");

    const maxChars = 90;
    items.value.forEach((item: any, index: number) => {
      lines.push(`#${index + 1} ${item.original_title || item.title}`);
      wrapLines(
        `${t("my.form.url")}: ${item.url || "—"}`,
        maxChars,
      ).forEach((l) => lines.push(l));
      wrapLines(
        `${t("my.form.price")}: ${
          item.price_eur != null ? fmtEUR.format(item.price_eur) : "—"
        }`,
        maxChars,
      ).forEach((l) => lines.push(l));
      lines.push(`${t("my.form.priority")}: ${item.priority ?? "—"}`);
      wrapLines(
        `${t("my.form.notes")}: ${item.notes ? item.notes : "—"}`,
        maxChars,
      ).forEach((l) => lines.push(l));
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

onMounted(load);
</script>
