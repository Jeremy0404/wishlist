export const BRAND_MARK = {
  viewBox: "0 0 32 32",
  tag: "M4 15.3 14.6 4.7a3 3 0 0 1 4.2 0l8.5 8.5a3 3 0 0 1 0 4.2L16.7 28a3 3 0 0 1-4.2 0L4 19.5a3 3 0 0 1 0-4.2Z",
  hole: { cx: 12.3, cy: 11.7, r: 2 },
} as const;

/** `accent-700` and `bg`, flattened for surfaces that cannot read a token —
 *  the canvas the PDF mark is rasterised on. */
const TAG_COLOR = "#8c491a";
const HOLE_COLOR = "#f5ead8";

export function brandMarkDataUrl(size: number): string {
  const { viewBox, tag, hole } = BRAND_MARK;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"` +
    ` viewBox="${viewBox}" fill="${TAG_COLOR}">` +
    `<path d="${tag}"/>` +
    `<circle cx="${hole.cx}" cy="${hole.cy}" r="${hole.r}" fill="${HOLE_COLOR}"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
