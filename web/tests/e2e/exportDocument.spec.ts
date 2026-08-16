import { expect, test } from "@playwright/test";
import {
  EM_DASH,
  buildMarkdown,
  type ExportDocument,
  type ExportRow,
} from "../../src/components/wishlist/exportDocument";

function row(overrides: Partial<ExportRow> = {}): ExportRow {
  return {
    photoUrl: null,
    embedUrl: null,
    title: "Casque",
    price: "79,00 €",
    priority: "Priorité haute",
    ...overrides,
  };
}

function document(rows: ExportRow[]): ExportDocument {
  return {
    brand: "Wishlist",
    heading: "La wishlist de Alexa",
    exportedOn: "Exporté le 15 août 2026",
    footer: "Exporté depuis Wishlist le 15 août 2026",
    columns: ["Photo", "Article", "Prix", "Priorité"],
    rows,
  };
}

test.describe("buildMarkdown", () => {
  test("prints the brand, the heading, the date and the footer", () => {
    const markdown = buildMarkdown(document([row()]));

    expect(markdown).toContain("**Wishlist**");
    expect(markdown).toContain("# La wishlist de Alexa");
    expect(markdown).toContain("*Exporté le 15 août 2026*");
    expect(markdown).toContain("Exporté depuis Wishlist le 15 août 2026");
  });

  test("prints the four columns in order", () => {
    const markdown = buildMarkdown(document([]));

    expect(markdown).toContain("| Photo | Article | Prix | Priorité |");
    expect(markdown).toContain("| --- | --- | --- | --- |");
  });

  test("links a photo and renders an em dash without one", () => {
    const markdown = buildMarkdown(
      document([
        row({ photoUrl: "https://wishlist.test/api/uploads/abc.png" }),
        row({ title: "Livre", price: EM_DASH, priority: EM_DASH }),
      ]),
    );

    expect(markdown).toContain(
      "| ![](https://wishlist.test/api/uploads/abc.png) | Casque |",
    );
    expect(markdown).toContain(
      `| ${EM_DASH} | Livre | ${EM_DASH} | ${EM_DASH} |`,
    );
  });

  test("escapes a pipe so a title cannot break the table", () => {
    const markdown = buildMarkdown(document([row({ title: "A | B" })]));

    expect(markdown).toContain("| A \\| B |");
  });
});
