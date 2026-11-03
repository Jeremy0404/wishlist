export function errorMessage(e: unknown, fallback = ""): string {
  return e instanceof Error && e.message ? e.message : fallback;
}
