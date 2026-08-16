export type IconShapes = {
  paths?: string[];
  circles?: [number, number, number][];
  rects?: [number, number, number, number, number][];
  lines?: [number, number, number, number][];
};

export const icons = {
  gift: {
    paths: [
      "M12 8v13",
      "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7",
      "M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8",
      "M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8",
    ],
    rects: [[3, 8, 18, 4, 1]],
  },
  share: {
    circles: [
      [18, 5, 3],
      [6, 12, 3],
      [18, 19, 3],
    ],
    lines: [
      [8.59, 13.51, 15.42, 17.49],
      [15.41, 6.51, 8.59, 10.49],
    ],
  },
  user: {
    paths: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"],
    circles: [[12, 7, 4]],
  },
  users: {
    paths: [
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
      "M22 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
    ],
    circles: [[9, 7, 4]],
  },
  download: {
    paths: [
      "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
      "m7 10 5 5 5-5",
      "M12 15V3",
    ],
  },
  chevronDown: {
    paths: ["m6 9 6 6 6-6"],
  },
  arrowRight: {
    paths: ["M5 12h14", "m12 5 7 7-7 7"],
  },
  arrowLeft: {
    paths: ["M19 12H5", "m12 19-7-7 7-7"],
  },
  check: {
    paths: ["M20 6 9 17l-5-5"],
  },
  checkCircle: {
    paths: ["m9 12 2 2 4-4"],
    circles: [[12, 12, 10]],
  },
  undo: {
    paths: ["M3 12a9 9 0 1 0 2.6-6.4L3 8", "M3 3v5h5"],
  },
  plus: {
    paths: ["M5 12h14", "M12 5v14"],
  },
  close: {
    paths: ["M18 6 6 18", "m6 6 12 12"],
  },
  pencil: {
    paths: ["M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"],
  },
  trash: {
    paths: [
      "M3 6h18",
      "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
      "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    ],
    lines: [
      [10, 11, 10, 17],
      [14, 11, 14, 17],
    ],
  },
  link: {
    paths: [
      "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
      "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    ],
  },
  externalLink: {
    paths: [
      "M15 3h6v6",
      "M10 14 21 3",
      "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
    ],
  },
  copy: {
    paths: ["M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"],
    rects: [[8, 8, 14, 14, 2]],
  },
  mail: {
    paths: ["m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"],
    rects: [[2, 4, 20, 16, 2]],
  },
  logOut: {
    paths: [
      "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
      "m16 17 5-5-5-5",
      "M21 12H9",
    ],
  },
  bell: {
    paths: [
      "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",
      "M10.3 21a1.94 1.94 0 0 0 3.4 0",
    ],
  },
  circleSlash: {
    circles: [[12, 12, 10]],
    lines: [[4.93, 4.93, 19.07, 19.07]],
  },
  alertCircle: {
    circles: [[12, 12, 10]],
    lines: [
      [12, 8, 12, 12],
      [12, 16, 12.01, 16],
    ],
  },
  alert: {
    paths: [
      "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      "M12 9v4",
      "M12 17h.01",
    ],
  },
} satisfies Record<string, IconShapes>;

export type IconName = keyof typeof icons;

/** jsPDF draws images, not vectors: the brand mark reaches the export as a
 *  rasterisable data URL built from the very same shapes `Icon.vue` renders. */
export function iconDataUrl(name: IconName, color: string, size = 24): string {
  const shapes: IconShapes = icons[name];
  const elements = [
    ...(shapes.paths ?? []).map((d) => `<path d="${d}"/>`),
    ...(shapes.circles ?? []).map(
      ([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`,
    ),
    ...(shapes.rects ?? []).map(
      ([x, y, w, h, rx]) =>
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`,
    ),
    ...(shapes.lines ?? []).map(
      ([x1, y1, x2, y2]) =>
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`,
    ),
  ].join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"` +
    ` viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.75"` +
    ` stroke-linecap="round" stroke-linejoin="round">${elements}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
