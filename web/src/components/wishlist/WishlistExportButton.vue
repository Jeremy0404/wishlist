<template>
  <div ref="dropdownRef" class="relative">
    <Button
      variant="ghost"
      data-test="wishlist-export"
      :disabled="!safeItems.length || exporting"
      :loading="exporting"
      @click="toggleDropdown"
    >
      <Icon name="download" />
      {{ t("my.export.action") }}
      <Icon
        name="chevronDown"
        :size="14"
        class="transition-transform"
        :class="dropdownOpen && 'rotate-180'"
      />
    </Button>

    <Card
      v-if="dropdownOpen"
      elevation="md"
      class="absolute right-0 z-10 mt-2 w-max min-w-56"
      data-test="wishlist-export-menu"
    >
      <button
        v-for="format in formats"
        :key="format.test"
        class="flex w-full items-center gap-2 whitespace-nowrap rounded-sm px-2 py-2 text-left text-control text-ink transition-colors hover:bg-ink/7"
        :data-test="format.test"
        :disabled="exporting"
        @click="format.run"
      >
        <Icon name="download" :size="14" />
        {{ format.label }}
      </button>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { jsPDF } from "jspdf";
import Button from "../ui/Button.vue";
import Card from "../ui/Card.vue";
import Icon from "../ui/Icon.vue";
import { brandMarkDataUrl } from "../ui/brandMark";
import { useToasts } from "../ui/useToasts";
import { fmtEUR } from "../../utils/money";
import { priorityLevel } from "../../utils/priority";
import {
  absoluteImageUrl,
  isStoredImage,
  toJpegDataUrl,
} from "../../utils/image";
import { useAuth } from "../../stores/auth";
import type { WishlistItem } from "../../types.ts";
import {
  EM_DASH,
  buildMarkdown,
  fmtExportDate,
  type ExportDocument,
  type ExportRow,
} from "./exportDocument";
import { PAPER, renderExportPdf } from "./pdfUtils";

const MARK_PIXELS = 48;
const PHOTO_PIXELS = 96;
const LOWEST_PRIORITY = 6;

const props = defineProps<{ items: WishlistItem[] }>();
const exporting = ref(false);
const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const { push } = useToasts();
const { t } = useI18n();
const auth = useAuth();

const safeItems = computed(() => props.items ?? []);
const sortedItems = computed(() =>
  [...safeItems.value].sort(
    (a, b) => (a.priority ?? LOWEST_PRIORITY) - (b.priority ?? LOWEST_PRIORITY),
  ),
);
const heading = computed(() =>
  auth.user?.name
    ? t("my.export.docTitle", { name: auth.user.name })
    : t("my.title"),
);
const formats = computed(() => [
  { test: "wishlist-export-pdf", label: t("my.export.pdf"), run: exportPdf },
  {
    test: "wishlist-export-markdown",
    label: t("my.export.markdown"),
    run: exportMarkdown,
  },
]);

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

function toRow(item: WishlistItem): ExportRow {
  const level = priorityLevel(item.priority);
  const photoUrl = absoluteImageUrl(item.image_url);
  return {
    photoUrl,
    embedUrl: isStoredImage(item.image_url) ? photoUrl : null,
    title: (item.original_title || item.title || "").trim() || EM_DASH,
    price: item.price_eur == null ? EM_DASH : fmtEUR.format(item.price_eur),
    priority: level ? t(`priority.${level}`) : EM_DASH,
  };
}

function buildDocument(): ExportDocument {
  const date = fmtExportDate.format(new Date());
  return {
    brand: t("nav.wishlist"),
    heading: heading.value,
    exportedOn: t("my.export.exportedOn", { date }),
    footer: t("my.export.footer", { date }),
    columns: [
      t("my.export.photoColumn"),
      t("my.export.itemColumn"),
      t("my.export.priceColumn"),
      t("my.export.priorityColumn"),
    ],
    rows: sortedItems.value.map(toRow),
  };
}

async function withPhotos(exportDoc: ExportDocument) {
  await Promise.all(
    exportDoc.rows.map(async (row) => {
      if (!row.embedUrl) return;
      row.photoData = await toJpegDataUrl(row.embedUrl, PHOTO_PIXELS, PAPER);
    }),
  );
  return exportDoc;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function runExport(
  build: () => Promise<void>,
  successKey: string,
  errorKey: string,
) {
  if (!safeItems.value.length) return;
  exporting.value = true;
  closeDropdown();
  try {
    await build();
    push(t(successKey), "success");
  } catch (e) {
    console.error(e);
    push(t(errorKey), "error");
  } finally {
    exporting.value = false;
  }
}

async function exportPdf() {
  await runExport(
    async () => {
      const exportDoc = await withPhotos(buildDocument());
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const mark = await toJpegDataUrl(
        brandMarkDataUrl(MARK_PIXELS),
        MARK_PIXELS,
        PAPER,
      );
      renderExportPdf(pdf, exportDoc, mark);
      download(pdf.output("blob") as Blob, "wishlist.pdf");
    },
    "my.export.success",
    "my.export.error",
  );
}

async function exportMarkdown() {
  await runExport(
    async () => {
      const content = buildMarkdown(buildDocument());
      download(new Blob([content], { type: "text/markdown" }), "wishlist.md");
    },
    "my.export.markdownSuccess",
    "my.export.markdownError",
  );
}
</script>
