import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { jsPDF } from "jspdf";
import { brandMarkDataUrl } from "../components/ui/brandMark";
import { useToasts } from "../components/ui/useToasts";
import {
  EM_DASH,
  fmtExportDate,
  type ExportDocument,
  type ExportRow,
} from "../components/wishlist/exportDocument";
import { PAPER, renderExportPdf } from "../components/wishlist/pdfUtils";
import { fmtEUR } from "../utils/money";
import { priorityLevel } from "../utils/priority";
import { absoluteImageUrl, isStoredImage, toJpegDataUrl } from "../utils/image";
import { useAuth } from "../stores/auth";
import type { WishlistItem } from "../types.ts";

const MARK_PIXELS = 48;
const PHOTO_PIXELS = 96;
const LOWEST_PRIORITY = 6;

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function usePrintList() {
  const { t } = useI18n();
  const { push } = useToasts();
  const auth = useAuth();
  const printing = ref(false);

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

  function buildDocument(items: WishlistItem[]): ExportDocument {
    const date = fmtExportDate.format(new Date());
    const sorted = [...items].sort(
      (a, b) =>
        (a.priority ?? LOWEST_PRIORITY) - (b.priority ?? LOWEST_PRIORITY),
    );
    return {
      brand: t("nav.wishlist"),
      heading: auth.user?.name
        ? t("my.export.docTitle", { name: auth.user.name })
        : t("my.title"),
      exportedOn: t("my.export.exportedOn", { date }),
      footer: t("my.export.footer", { date }),
      columns: [
        t("my.export.photoColumn"),
        t("my.export.itemColumn"),
        t("my.export.priceColumn"),
        t("my.export.priorityColumn"),
      ],
      rows: sorted.map(toRow),
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

  async function print(items: WishlistItem[]) {
    if (printing.value) return;
    printing.value = true;
    try {
      const exportDoc = await withPhotos(buildDocument(items));
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const mark = await toJpegDataUrl(
        brandMarkDataUrl(MARK_PIXELS),
        MARK_PIXELS,
        PAPER,
      );
      renderExportPdf(pdf, exportDoc, mark);
      download(pdf.output("blob") as Blob, "wishlist.pdf");
      push(t("my.export.success"), "success");
    } catch (e) {
      console.error(e);
      push(t("my.export.error"), "error");
    } finally {
      printing.value = false;
    }
  }

  return { printing, print };
}
