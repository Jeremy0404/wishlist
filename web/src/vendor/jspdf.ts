interface JsPDFOptions {
  unit?: string;
  format?: string | [number, number];
}

type FontStyle = "normal" | "bold";

type TextContent = string | string[];

interface TextOperation {
  type: "text";
  content: string;
  x: number;
  y: number;
  color: [number, number, number];
  fontSize: number;
  fontStyle: FontStyle;
}

interface RectOperation {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: [number, number, number];
  fill: boolean;
}

type Operation = TextOperation | RectOperation;

function toPdfHex(text: string) {
  const winAnsiExtras: Record<number, number> = {
    0x20ac: 0x80,
    0x201a: 0x82,
    0x2030: 0x89,
    0x2018: 0x91,
    0x2019: 0x92,
    0x201c: 0x93,
    0x201d: 0x94,
    0x2022: 0x95,
    0x2013: 0x96,
    0x2014: 0x97,
    0x2122: 0x99,
  };

  const bytes: number[] = [];
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0;
    const mapped = winAnsiExtras[codePoint];
    if (mapped != null) {
      bytes.push(mapped);
    } else if (codePoint <= 0xff) {
      bytes.push(codePoint);
    } else {
      bytes.push(0x2a);
    }
  }

  return `<${bytes.map((unit) => unit.toString(16).padStart(2, "0")).join("")}>`;
}

function toRgb(opacity: [number, number, number]) {
  return opacity.map((v) => (v / 255).toFixed(3)).join(" ");
}

function buildPdf(pages: Operation[][], pageWidth: number, pageHeight: number) {
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

  const fontNormalId = 3;
  const fontBoldId = 4;
  const pageIds: number[] = [];

  const addObject = (id: number, body: string) => {
    offsets[id] = position;
    pushPart(`${id} 0 obj\n${body}\nendobj\n`);
  };

  const contentsStartId = 5;

  pages.forEach((ops, pageIndex) => {
    const contentLines = ops
      .map((op) => {
        if (op.type === "rect") {
          const y = pageHeight - (op.y + op.height);
          return `${toRgb(op.color)} rg\n${op.x.toFixed(2)} ${y.toFixed(2)} ${op.width.toFixed(2)} ${op.height.toFixed(2)} re ${
            op.fill ? "f" : "S"
          }\n`;
        }

        const fontId = op.fontStyle === "bold" ? fontBoldId : fontNormalId;
        const y = pageHeight - op.y;
        return `${toRgb(op.color)} rg\nBT /F${fontId} ${op.fontSize} Tf 1 0 0 1 ${op.x.toFixed(2)} ${y.toFixed(
          2,
        )} Tm ${toPdfHex(op.content)} Tj ET\n`;
      })
      .join("");

    const contentLength = encoder.encode(contentLines).length;
    const contentId = contentsStartId + pageIndex * 2;
    const pageId = contentsStartId + pageIndex * 2 + 1;
    pageIds.push(pageId);

    addObject(contentId, `<< /Length ${contentLength} >>\nstream\n${contentLines}endstream`);
    addObject(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(
        2,
      )}] /Contents ${contentId} 0 R /Resources << /Font << /F${fontNormalId} ${fontNormalId} 0 R /F${fontBoldId} ${fontBoldId} 0 R >> >> >>`,
    );
  });

  addObject(fontNormalId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  addObject(fontBoldId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  const kids = pageIds.map((id) => `${id} 0 R`).join(" ");
  addObject(2, `<< /Type /Pages /Kids [${kids}] /Count ${pageIds.length} >>`);
  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");

  const totalObjects = 4 + pages.length * 2;
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

function normalizeFormat(format?: string | [number, number]): [number, number] {
  if (Array.isArray(format) && format.length === 2) return format;
  const known = {
    a4: [595.28, 841.89],
  } as Record<string, [number, number]>;
  const key = typeof format === "string" ? format.toLowerCase() : "a4";
  const found = known[key];
  return (found ?? known.a4) as [number, number];
}

export class jsPDF {
  private pages: Operation[][] = [[]];
  private currentPage = 0;
  private fillColor: [number, number, number] = [0, 0, 0];
  private textColor: [number, number, number] = [0, 0, 0];
  private fontSize = 12;
  private fontStyle: FontStyle = "normal";
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };

  private pageWidth: number;
  private pageHeight: number;

  constructor(options: JsPDFOptions = {}) {
    const [width, height] = normalizeFormat(options.format);
    this.pageWidth = width;
    this.pageHeight = height;
    this.internal = {
      pageSize: {
        getWidth: () => this.pageWidth,
        getHeight: () => this.pageHeight,
      },
    };
  }

  setFillColor(r: number, g: number, b: number) {
    this.fillColor = [r, g, b];
    return this;
  }

  setTextColor(r: number, g: number, b: number) {
    this.textColor = [r, g, b];
    return this;
  }

  setFont(_family: string, style: FontStyle = "normal") {
    this.fontStyle = style;
    return this;
  }

  setFontSize(size: number) {
    this.fontSize = size;
    return this;
  }

  roundedRect(x: number, y: number, width: number, height: number, _rx: number, _ry: number, style = "S") {
    const fill = style.includes("F");
    this.pages[this.currentPage]?.push({ type: "rect", x, y, width, height, color: this.fillColor, fill });
    return this;
  }

  text(content: TextContent, x: number, y: number) {
    const lines = Array.isArray(content) ? content : [content];
    lines.forEach((line, idx) => {
      this.pages[this.currentPage]?.push({
        type: "text",
        content: line,
        x,
        y: y + idx * (this.fontSize + 2),
        color: this.textColor,
        fontSize: this.fontSize,
        fontStyle: this.fontStyle,
      });
    });
    return this;
  }

  splitTextToSize(text: string, width: number) {
    const charsPerLine = Math.max(1, Math.floor(width / (this.fontSize * 0.52)));
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (next.length > charsPerLine && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    });
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  addPage() {
    this.pages.push([]);
    this.currentPage = this.pages.length - 1;
    return this;
  }

  output(type: string) {
    const buffer = buildPdf(this.pages, this.pageWidth, this.pageHeight);
    if (type === "blob") return new Blob([buffer], { type: "application/pdf" });
    return buffer;
  }
}

export default jsPDF;
