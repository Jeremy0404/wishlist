import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOADS_ROUTE = "/uploads";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const GIF87A = Buffer.from("GIF87a", "ascii");
const GIF89A = Buffer.from("GIF89a", "ascii");
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const RIFF = Buffer.from("RIFF", "ascii");
const WEBP = Buffer.from("WEBP", "ascii");

const STORED_IMAGE = new RegExp(
  `^${UPLOADS_ROUTE}/[0-9a-f]{32}\\.(png|jpg|gif|webp)$`,
);

function startsWith(buffer: Buffer, magic: Buffer, offset = 0) {
  return buffer.subarray(offset, offset + magic.length).equals(magic);
}

/** The extension comes from what the bytes actually are, never from what the
 *  upload claims to be. */
export function detectImageExtension(buffer: Buffer): string | null {
  if (startsWith(buffer, PNG)) return "png";
  if (startsWith(buffer, JPEG)) return "jpg";
  if (startsWith(buffer, GIF87A) || startsWith(buffer, GIF89A)) return "gif";
  if (startsWith(buffer, RIFF) && startsWith(buffer, WEBP, 8)) return "webp";
  return null;
}

export function isStoredImage(value: string): boolean {
  return STORED_IMAGE.test(value);
}

export function isLinkedImage(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function uploadsDir(): string {
  return path.resolve(process.env.UPLOADS_DIR ?? "uploads");
}

export async function storeImage(buffer: Buffer): Promise<string | null> {
  const extension = detectImageExtension(buffer);
  if (!extension) return null;

  const name = `${randomBytes(16).toString("hex")}.${extension}`;
  await mkdir(uploadsDir(), { recursive: true });
  await writeFile(path.join(uploadsDir(), name), buffer);
  return `${UPLOADS_ROUTE}/${name}`;
}

export async function removeImage(value?: string | null): Promise<void> {
  if (!value || !isStoredImage(value)) return;
  await unlink(path.join(uploadsDir(), path.basename(value))).catch(() => {});
}
