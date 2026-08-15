export function toHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;

  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    return null;
  }
}
