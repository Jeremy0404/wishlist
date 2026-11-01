export const EM_DASH = "—";

export type ExportRow = {
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
