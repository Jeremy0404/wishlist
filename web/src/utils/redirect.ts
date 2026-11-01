const HOME = "/me";

/** `//host` and `/\host` are read by browsers as another origin. */
export function inAppRedirect(value: unknown): string {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !/^\/[/\\]/.test(value)
    ? value
    : HOME;
}
