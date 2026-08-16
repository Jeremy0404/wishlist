export const EM_DASH = "—";

export type ExportRow = {
  /** The link the Markdown prints. */
  photoUrl: string | null;
  /** What the PDF may embed — a pasted link is left out, since embedding it
   *  would mean fetching a remote image at export time. */
  embedUrl: string | null;
  /** The embedded bitmap, once it has been rasterised. */
  photoData?: string | null;
  title: string;
  price: string;
  priority: string;
};

export type ExportColumns = [string, string, string, string];

export type ExportDocument = {
  brand: string;
  heading: string;
  exportedOn: string;
  footer: string;
  columns: ExportColumns;
  rows: ExportRow[];
};

export const fmtExportDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function cell(value: string) {
  return value.replace(/\|/g, "\\|");
}

function photoCell(photoUrl: string | null) {
  return photoUrl ? `![](${cell(photoUrl)})` : EM_DASH;
}

function row(values: string[]) {
  return `| ${values.join(" | ")} |`;
}

export function buildMarkdown(exportDoc: ExportDocument): string {
  const table = [
    row(exportDoc.columns.map(cell)),
    row(exportDoc.columns.map(() => "---")),
    ...exportDoc.rows.map((item) =>
      row([
        photoCell(item.photoUrl),
        cell(item.title),
        cell(item.price),
        cell(item.priority),
      ]),
    ),
  ].join("\n");

  return [
    `**${exportDoc.brand}**`,
    `# ${exportDoc.heading}`,
    `*${exportDoc.exportedOn}*`,
    table,
    "---",
    exportDoc.footer,
    "",
  ].join("\n\n");
}
