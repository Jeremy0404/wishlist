import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { brandMarkDataUrl } from "../components/ui/brandMark";
import { useToasts } from "../components/ui/useToasts";
import {
  EM_DASH,
  fmtExportDate,
  type ExportDocument,
  type ExportRow,
} from "../components/wishlist/exportDocument";
import { fmtEUR } from "../utils/money";
import { isFavorite } from "../utils/favorite";
import { absoluteImageUrl, isStoredImage, toJpegDataUrl } from "../utils/image";
import { useAuth } from "../stores/auth";
import type { OwnItem } from "../types.ts";

const MARK_PIXELS = 48;
const PHOTO_PIXELS = 96;

function loadPdfRenderer() {
  return Promise.all([
    import("jspdf"),
    import("../components/wishlist/pdfUtils"),
  ]);
}

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

  function toRow(item: OwnItem): ExportRow {
    return {
      embedUrl: isStoredImage(item.image_url)
        ? absoluteImageUrl(item.image_url)
        : null,
      title: (item.original_title || item.title || "").trim() || EM_DASH,
      price: item.price_eur == null ? EM_DASH : fmtEUR.format(item.price_eur),
      priority: isFavorite(item.priority) ? t("item.favorite") : EM_DASH,
    };
  }

  function buildDocument(items: OwnItem[]): ExportDocument {
    const date = fmtExportDate.format(new Date());
    const sorted = [...items].sort(
      (a, b) => Number(isFavorite(b.priority)) - Number(isFavorite(a.priority)),
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

  async function withPhotos(exportDoc: ExportDocument, paper: string) {
    await Promise.all(
      exportDoc.rows.map(async (row) => {
        if (!row.embedUrl) return;
        row.photoData = await toJpegDataUrl(row.embedUrl, PHOTO_PIXELS, paper);
      }),
    );
    return exportDoc;
  }

  async function print(items: OwnItem[]) {
    if (printing.value) return;
    printing.value = true;
    try {
      const [{ jsPDF }, { PAPER, renderExportPdf }] = await loadPdfRenderer();
      const exportDoc = await withPhotos(buildDocument(items), PAPER);
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
