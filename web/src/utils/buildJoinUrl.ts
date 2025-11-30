export function buildJoinUrl(code: string, baseHref?: string): string {
  const href =
    baseHref ??
    (typeof location !== "undefined" ? location.href : "https://example.com/");
  const url = new URL(href);
  url.pathname = "/family/join";
  url.searchParams.delete("code");
  if (code) url.searchParams.set("code", code);
  return url.toString();
}
