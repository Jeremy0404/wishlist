import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

export type LinkPreview = {
  title: string | null;
  price_eur: number | null;
  image_url: string | null;
};

export const EMPTY_PREVIEW: LinkPreview = {
  title: null,
  price_eur: null,
  image_url: null,
};

export const MAX_BODY_BYTES = 1024 * 1024;

const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 5000;
const MAX_TITLE_LENGTH = 255;
const MAX_IMAGE_URL_LENGTH = 2048;
const MAX_PRICE_EUR = 99_999_999.99;
const USER_AGENT = "wishlist-link-preview";
const ACCEPT_LANGUAGE = "fr-FR,fr;q=0.9";
const DEFAULT_CHARSET = "utf-8";
const CHARSET_SNIFF_BYTES = 1024;
const HTML_TYPES = ["text/html", "application/xhtml+xml"];
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export type AddressGuard = (address: string) => boolean;

export type PreviewOptions = {
  isAddressAllowed?: AddressGuard;
  timeoutMs?: number;
};

function isPrivateIpv4(address: string): boolean {
  const [a, b] = address.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return a >= 224;
}

function isPrivateIpv6(address: string): boolean {
  const ip = address.toLowerCase().split("%")[0];
  if (ip === "::" || ip === "::1") return true;

  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);

  return /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip);
}

export function isPublicAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) return !isPrivateIpv4(address);
  if (family === 6) return !isPrivateIpv6(address);
  return false;
}

function guardedLookup(isAddressAllowed: AddressGuard): net.LookupFunction {
  return (hostname, options, callback) => {
    dns.lookup(hostname, options, (err, address, family) => {
      if (err) return callback(err, address as string, family);

      const resolved = Array.isArray(address)
        ? address.map((entry) => entry.address)
        : [address];
      if (!resolved.every(isAddressAllowed)) {
        return callback(
          new Error(`blocked address for ${hostname}`),
          "",
          family,
        );
      }

      callback(null, address as string, family);
    });
  };
}

/** `net.connect` skips the custom lookup when the host is already an IP
 *  literal, so those never reach the DNS guard and are checked here. */
function literalAddress(url: URL): string | null {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  return net.isIP(host) ? host : null;
}

function toPublicUrl(value: string, base?: URL): URL | null {
  try {
    const url = new URL(value, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function isHtml(contentType: string | undefined): boolean {
  if (!contentType) return false;
  const type = contentType.split(";")[0].trim().toLowerCase();
  return HTML_TYPES.includes(type);
}

const CHARSET = /charset\s*=\s*["']?([\w.:-]+)/i;

function declaredCharset(contentType: string | undefined, body: Buffer) {
  const head = body.subarray(0, CHARSET_SNIFF_BYTES).toString("latin1");
  const meta = head.match(/<meta\b[^>]*>/gi)?.find((tag) => CHARSET.test(tag));

  return (
    contentType?.match(CHARSET)?.[1] ??
    meta?.match(CHARSET)?.[1] ??
    DEFAULT_CHARSET
  );
}

function decodeBody(body: Buffer, contentType: string | undefined): string {
  try {
    return new TextDecoder(declaredCharset(contentType, body)).decode(body);
  } catch {
    return new TextDecoder(DEFAULT_CHARSET).decode(body);
  }
}

type Fetched = { html: string } | { redirect: string };

function requestOnce(
  url: URL,
  lookup: net.LookupFunction,
  timeoutMs: number,
): Promise<Fetched | null> {
  return new Promise((resolve) => {
    const client = url.protocol === "https:" ? https : http;
    let settled = false;

    const req = client.request(
      url,
      {
        method: "GET",
        lookup,
        headers: {
          accept: "text/html,application/xhtml+xml",
          "accept-encoding": "identity",
          "accept-language": ACCEPT_LANGUAGE,
          "user-agent": USER_AGENT,
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;

        if (REDIRECT_STATUSES.has(status) && location) {
          res.destroy();
          return settle({ redirect: location });
        }
        if (status !== 200 || !isHtml(res.headers["content-type"])) {
          res.destroy();
          return settle(null);
        }

        const contentType = res.headers["content-type"];
        const chunks: Buffer[] = [];
        let size = 0;
        const finish = () =>
          settle({ html: decodeBody(Buffer.concat(chunks), contentType) });

        res.on("data", (chunk: Buffer) => {
          const room = MAX_BODY_BYTES - size;
          chunks.push(chunk.length > room ? chunk.subarray(0, room) : chunk);
          size += Math.min(chunk.length, room);
          if (size >= MAX_BODY_BYTES) {
            res.destroy();
            finish();
          }
        });
        res.on("end", finish);
        res.on("error", () => settle(null));
      },
    );

    const timer = setTimeout(() => settle(null), timeoutMs);

    function settle(result: Fetched | null) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      req.destroy();
      resolve(result);
    }

    req.on("error", () => settle(null));
    req.end();
  });
}

async function fetchHtml(
  rawUrl: string,
  {
    isAddressAllowed = isPublicAddress,
    timeoutMs = REQUEST_TIMEOUT_MS,
  }: PreviewOptions,
): Promise<{ html: string; url: URL } | null> {
  const lookup = guardedLookup(isAddressAllowed);
  const deadline = Date.now() + timeoutMs;
  let target = toPublicUrl(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!target) return null;

    const literal = literalAddress(target);
    if (literal && !isAddressAllowed(literal)) return null;

    const remaining = deadline - Date.now();
    if (remaining <= 0) return null;

    const result = await requestOnce(target, lookup, remaining);
    if (!result) return null;
    if ("html" in result) return { html: result.html, url: target };

    target = toPublicUrl(result.redirect, target);
  }

  return null;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const COMBINING: Record<string, string> = {
  grave: "\u0300",
  acute: "\u0301",
  circ: "\u0302",
  tilde: "\u0303",
  uml: "\u0308",
  ring: "\u030a",
  cedil: "\u0327",
};

function decodeAccent(entity: string): string | null {
  const [, letter, accent] =
    entity.match(/^([a-z])(grave|acute|circ|tilde|uml|ring|cedil)$/i) ?? [];
  if (!letter) return null;

  return (letter + COMBINING[accent.toLowerCase()]).normalize("NFC");
}

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      return String.fromCodePoint(parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number(entity.slice(1)));
    }
    return ENTITIES[entity.toLowerCase()] ?? decodeAccent(entity) ?? match;
  });
}

function clean(value: string): string {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

function attribute(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"),
  );
  if (!match) return null;
  return match[2] ?? match[3] ?? match[4] ?? null;
}

function readMetaTags(html: string): Map<string, string> {
  const metas = new Map<string, string>();

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = attribute(tag, "property") ?? attribute(tag, "name");
    const content = attribute(tag, "content");
    if (!key || content === null) continue;

    const name = key.toLowerCase().trim();
    if (!metas.has(name)) metas.set(name, content);
  }

  return metas;
}

export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? round(value) : null;
  }
  if (typeof value !== "string") return null;

  const digits = value.replace(/[^\d.,]/g, "");
  if (!digits) return null;

  const lastComma = digits.lastIndexOf(",");
  const lastDot = digits.lastIndexOf(".");
  let normalized: string;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimal = Math.max(lastComma, lastDot);
    normalized =
      digits.slice(0, decimal).replace(/[.,]/g, "") +
      "." +
      digits.slice(decimal + 1);
  } else if (lastComma >= 0) {
    normalized = /,\d{3}$/.test(digits)
      ? digits.replace(/,/g, "")
      : digits.replace(",", ".");
  } else {
    normalized = /\.\d{3}$/.test(digits) ? digits.replace(/\./g, "") : digits;
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) ? round(amount) : null;
}

function round(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function inRange(amount: number | null): number | null {
  if (amount === null) return null;
  return amount >= 0 && amount <= MAX_PRICE_EUR ? amount : null;
}

function isEur(currency: unknown): boolean {
  if (currency === undefined || currency === null || currency === "")
    return true;
  return typeof currency === "string" && /^(eur|€)$/i.test(currency.trim());
}

type JsonRecord = Record<string, unknown>;
type Offer = { price: unknown; priceCurrency?: unknown };

type Page = {
  html: string;
  metas: Map<string, string>;
  jsonLd: unknown[];
  itemprops: Map<string, string>;
};

const IMAGE_META_KEYS = [
  "og:image",
  "og:image:secure_url",
  "og:image:url",
  "twitter:image",
  "twitter:image:src",
];

function readItemprops(html: string): Map<string, string> {
  const props = new Map<string, string>();

  for (const [, tag, text] of html.matchAll(
    /(<[a-z][^>]*\bitemprop\s*=[^>]*>)([^<]*)/gi,
  )) {
    const value = clean(
      attribute(tag, "content") ??
        attribute(tag, "src") ??
        attribute(tag, "href") ??
        text,
    );
    if (!value) continue;

    for (const name of attribute(tag, "itemprop")?.split(/\s+/) ?? []) {
      if (!props.has(name)) props.set(name, value);
    }
  }

  return props;
}

function readJsonLd(html: string): unknown[] {
  const scripts =
    html.match(
      /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ) ?? [];

  return scripts.flatMap((script) => {
    const body = script.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    try {
      return [JSON.parse(body)];
    } catch {
      return [];
    }
  });
}

function findInJson<T>(
  node: unknown,
  pick: (record: JsonRecord) => T | null,
): T | null {
  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findInJson(entry, pick);
      if (found !== null) return found;
    }
    return null;
  }
  if (!node || typeof node !== "object") return null;

  const record = node as JsonRecord;
  return pick(record) ?? findInJson(Object.values(record), pick);
}

function hasType(record: JsonRecord, pattern: RegExp): boolean {
  return [record["@type"]]
    .flat()
    .some((type) => typeof type === "string" && pattern.test(type));
}

function pickOffer(record: JsonRecord): Offer | null {
  if (!hasType(record, /offer/i)) return null;

  const spec = [record.priceSpecification].flat()[0] as JsonRecord | undefined;
  const price = record.price ?? record.lowPrice ?? spec?.price;
  if (price === undefined) return null;

  return { price, priceCurrency: record.priceCurrency ?? spec?.priceCurrency };
}

function imageSource(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return imageSource(value[0]);
  if (!value || typeof value !== "object") return null;

  const image = value as JsonRecord;
  return imageSource(image.url ?? image.contentUrl);
}

function pickProductImage(record: JsonRecord): string | null {
  return hasType(record, /product/i) ? imageSource(record.image) : null;
}

function microdataOffer(itemprops: Map<string, string>): Offer | null {
  const price = itemprops.get("price") ?? itemprops.get("lowPrice");
  if (price === undefined) return null;

  return { price, priceCurrency: itemprops.get("priceCurrency") };
}

function imageSrcLink(html: string): string | null {
  const link = html
    .match(/<link\b[^>]*>/gi)
    ?.find((tag) =>
      attribute(tag, "rel")?.toLowerCase().split(/\s+/).includes("image_src"),
    );

  return link ? attribute(link, "href") : null;
}

function readPrice({ metas, jsonLd, itemprops }: Page): number | null {
  const amount =
    metas.get("og:price:amount") ?? metas.get("product:price:amount");

  if (amount !== undefined) {
    const currency =
      metas.get("og:price:currency") ?? metas.get("product:price:currency");
    return isEur(currency) ? inRange(parseAmount(amount)) : null;
  }

  const offer = findInJson(jsonLd, pickOffer) ?? microdataOffer(itemprops);
  if (!offer) return null;
  return isEur(offer.priceCurrency) ? inRange(parseAmount(offer.price)) : null;
}

function readTitle({ html, metas }: Page): string | null {
  const meta = metas.get("og:title");
  const tag = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const title = clean(meta ?? tag ?? "");

  return title ? title.slice(0, MAX_TITLE_LENGTH) : null;
}

function readImage(page: Page, pageUrl: URL): string | null {
  const candidates = [
    ...IMAGE_META_KEYS.map((key) => page.metas.get(key)),
    findInJson(page.jsonLd, pickProductImage),
    page.itemprops.get("image"),
    imageSrcLink(page.html),
  ];

  for (const candidate of candidates) {
    const source = candidate && clean(candidate);
    if (!source) continue;

    const image = toPublicUrl(source, pageUrl);
    if (image && image.href.length <= MAX_IMAGE_URL_LENGTH) return image.href;
  }

  return null;
}

export function parseLinkPreview(html: string, pageUrl: URL): LinkPreview {
  const page: Page = {
    html,
    metas: readMetaTags(html),
    jsonLd: readJsonLd(html),
    itemprops: readItemprops(html),
  };

  return {
    title: readTitle(page),
    price_eur: readPrice(page),
    image_url: readImage(page, pageUrl),
  };
}

/** Resolves a pasted link into what the page says about itself. Every failure —
 *  blocked host, timeout, no outbound internet, unparseable page — is an empty
 *  preview, never an error: the fetch is a convenience, never a gate. */
export async function fetchLinkPreview(
  rawUrl: string,
  options: PreviewOptions = {},
): Promise<LinkPreview> {
  const page = await fetchHtml(rawUrl, options);
  if (!page) return EMPTY_PREVIEW;

  return parseLinkPreview(page.html, page.url);
}
