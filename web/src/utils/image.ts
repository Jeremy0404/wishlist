import { API_URL } from "../services/api";

const STORED_PREFIX = "/uploads/";

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

/** Uploads are stored as a path relative to the API, which is not where the
 *  browser reaches it; a pasted link is already absolute. */
export function itemImageSrc(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  return imageUrl.startsWith(STORED_PREFIX)
    ? `${API_URL}${imageUrl}`
    : imageUrl;
}

export function isStoredImage(imageUrl?: string | null): boolean {
  return !!imageUrl?.startsWith(STORED_PREFIX);
}

/** A document leaves the browser: a path the app resolves at runtime means
 *  nothing once the file is opened elsewhere. */
export function absoluteImageUrl(imageUrl?: string | null): string | null {
  const src = itemImageSrc(imageUrl);
  return src ? new URL(src, window.location.origin).href : null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

/** Square, centre-cropped and flattened onto the paper colour, because the PDF
 *  generator embeds opaque JPEGs and nothing else. Anything that fails to load
 *  gives back nothing. */
export async function toJpegDataUrl(
  src: string,
  pixels: number,
  background: string,
): Promise<string | null> {
  try {
    const image = await loadImage(src);
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    if (!side) return null;

    const canvas = document.createElement("canvas");
    canvas.width = pixels;
    canvas.height = pixels;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = background;
    context.fillRect(0, 0, pixels, pixels);
    context.drawImage(
      image,
      (image.naturalWidth - side) / 2,
      (image.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      pixels,
      pixels,
    );
    return canvas.toDataURL("image/jpeg", 0.9);
  } catch {
    return null;
  }
}
