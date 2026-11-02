export const TONES = [
  "bg-tone-yellow text-tone-yellow-ink",
  "bg-tone-green text-tone-green-ink",
  "bg-tone-pink text-tone-pink-ink",
  "bg-tone-blue text-tone-blue-ink",
] as const;

export const QUIET_TONE = "bg-neutral-200 text-neutral-500";

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/** Keyed on the id rather than the position, so a tone never shifts when
 *  something is added to or removed from a list. */
export function toneFor(id: string): string {
  return TONES[hash(id) % TONES.length] ?? QUIET_TONE;
}
