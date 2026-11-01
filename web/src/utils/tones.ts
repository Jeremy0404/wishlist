export const TONES = [
  "bg-tone-yellow text-tone-yellow-ink",
  "bg-tone-green text-tone-green-ink",
  "bg-tone-pink text-tone-pink-ink",
  "bg-tone-blue text-tone-blue-ink",
] as const;

export const QUIET_TONE = "bg-neutral-200 text-neutral-500";

export function toneAt(index: number): string {
  return TONES[index % TONES.length] ?? QUIET_TONE;
}
