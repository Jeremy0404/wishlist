import { expect, test } from "@playwright/test";
import { jsPDF } from "../../src/vendor/jspdf";
import { renderExportPdf } from "../../src/components/wishlist/pdfUtils";
import type { ExportDocument } from "../../src/components/wishlist/exportDocument";

/** 32x32, start-of-frame only: enough for the generator to size the XObject. */
const JPEG = "data:image/jpeg;base64,/9j/wAARCAAgACADAREAAhEBAxEB/9k=";

const exportDoc: ExportDocument = {
  brand: "Wishlist",
  heading: "La wishlist de Alexa",
  exportedOn: "Exporté le 15 août 2026",
  footer: "Exporté depuis Wishlist le 15 août 2026",
  columns: ["Photo", "Article", "Prix", "Priorité"],
  rows: [
    {
      photoUrl: "https://wishlist.test/api/uploads/abc.jpg",
      embedUrl: "https://wishlist.test/api/uploads/abc.jpg",
      photoData: JPEG,
      title: "Casque",
      price: "79,00 €",
      priority: "Priorité haute",
    },
    {
      photoUrl: null,
      embedUrl: null,
      title: "Livre",
      price: "—",
      priority: "—",
    },
  ],
};

async function render(document: ExportDocument, mark: string | null = JPEG) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  renderExportPdf(doc as never, document, mark);
  const blob = doc.output("blob") as Blob;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { bytes, text: new TextDecoder("latin1").decode(bytes) };
}

test.describe("the exported PDF", () => {
  test("is a PDF whose cross-reference table survives the image streams", async () => {
    const { bytes, text } = await render(exportDoc);

    expect(text.startsWith("%PDF-1.4")).toBe(true);

    const start = Number(
      text
        .slice(text.lastIndexOf("startxref") + 9)
        .trim()
        .split("\n")[0],
    );
    const entries = text
      .slice(start)
      .split("\n")
      .filter((line) => line.endsWith(" n "));

    expect(entries.length).toBeGreaterThan(4);
    entries.forEach((entry, index) => {
      const offset = Number(entry.slice(0, 10));
      const object = new TextDecoder("latin1").decode(
        bytes.subarray(offset, offset + 20),
      );
      expect(object.startsWith(`${index + 1} 0 obj`)).toBe(true);
    });
  });

  test("embeds the photo as an image, sized from the JPEG itself", async () => {
    const { text } = await render(exportDoc);

    expect(text).toContain("/Subtype /Image");
    expect(text).toContain("/Width 32 /Height 32");
    expect(text).toContain("/Filter /DCTDecode");
    expect(text).toContain("/Im0 Do");
  });

  test("carries no image object when nothing can be embedded", async () => {
    const rows = exportDoc.rows.map((row) => ({
      ...row,
      photoData: undefined,
    }));
    const { text } = await render({ ...exportDoc, rows }, null);

    expect(text).not.toContain("/Subtype /Image");
    expect(text).not.toContain("/XObject");
  });
});
