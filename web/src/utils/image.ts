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
