import assert from "node:assert/strict";
import http from "node:http";
import { AddressInfo } from "node:net";
import test from "node:test";

import {
  EMPTY_PREVIEW,
  fetchLinkPreview,
  isPublicAddress,
  parseAmount,
  parseLinkPreview,
} from "./link-preview.js";

const PAGE_URL = new URL("https://shop.example/p/1");
const ONLY_LOOPBACK = (address: string) => address === "127.0.0.1";

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

async function startServer(handler: Handler) {
  const requests: string[] = [];
  const server = http.createServer((req, res) => {
    requests.push(req.url ?? "");
    res.on("error", () => {});
    handler(req, res);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}/`,
    requests,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

function html(body: string) {
  return (_req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(body);
  };
}

const PRODUCT_PAGE = `<!doctype html>
<html><head>
  <title>Fallback &amp; ignored</title>
  <meta property="og:title" content="Chaise en ch&ecirc;ne" />
  <meta property="og:price:amount" content="129,90" />
  <meta property="og:price:currency" content="EUR" />
  <meta property="og:image" content="/img/chaise.jpg" />
</head><body></body></html>`;

test("reads title, price and image from OpenGraph metadata", () => {
  assert.deepEqual(parseLinkPreview(PRODUCT_PAGE, PAGE_URL), {
    title: "Chaise en chêne",
    price_eur: 129.9,
    image_url: "https://shop.example/img/chaise.jpg",
  });
});

test("decodes the entities a French product page is written with", () => {
  const page =
    "<html><head><title>Caf&eacute;ti&egrave;re &amp; th&eacute;i&egrave;re &#8212; 2&#xa0;pi&egrave;ces</title></head></html>";

  assert.equal(
    parseLinkPreview(page, PAGE_URL).title,
    "Cafétière & théière — 2 pièces",
  );
});

test("falls back to the title tag when there is no og:title", () => {
  const page = "<html><head><title>  Un\n  cadeau  </title></head></html>";

  assert.equal(parseLinkPreview(page, PAGE_URL).title, "Un cadeau");
});

test("reads the price from schema.org offers when no meta price exists", () => {
  const page = `<html><head><script type="application/ld+json">
    {"@type":"Product","name":"x","offers":{"@type":"Offer","price":"49.99","priceCurrency":"EUR"}}
  </script></head></html>`;

  assert.equal(parseLinkPreview(page, PAGE_URL).price_eur, 49.99);
});

test("ignores a price advertised in another currency", () => {
  const page = `<html><head>
    <meta property="og:price:amount" content="129.90">
    <meta property="og:price:currency" content="USD">
  </head></html>`;

  assert.equal(parseLinkPreview(page, PAGE_URL).price_eur, null);
});

test("returns nulls rather than failing on a page with no metadata", () => {
  assert.deepEqual(
    parseLinkPreview("<html><body>rien</body></html>", PAGE_URL),
    EMPTY_PREVIEW,
  );
});

test("keeps an unusable image out of the preview", () => {
  const page = `<html><head><meta property="og:image" content="javascript:alert(1)"></head></html>`;

  assert.equal(parseLinkPreview(page, PAGE_URL).image_url, null);
});

test("falls back to the Twitter card image", () => {
  const page = `<html><head><meta name="twitter:image" content="https://cdn.shop.example/a.jpg"></head></html>`;

  assert.equal(
    parseLinkPreview(page, PAGE_URL).image_url,
    "https://cdn.shop.example/a.jpg",
  );
});

test("falls back to the image_src link", () => {
  const page = `<html><head><link rel="image_src" href="/a.jpg"></head></html>`;

  assert.equal(
    parseLinkPreview(page, PAGE_URL).image_url,
    "https://shop.example/a.jpg",
  );
});

test("skips an unusable image and keeps the next candidate", () => {
  const page = `<html><head>
    <meta property="og:image" content="javascript:alert(1)">
    <meta name="twitter:image" content="/b.jpg">
  </head></html>`;

  assert.equal(
    parseLinkPreview(page, PAGE_URL).image_url,
    "https://shop.example/b.jpg",
  );
});

test("reads the product image from schema.org, in each shape it comes in", () => {
  for (const image of [
    `"/c.jpg"`,
    `["/c.jpg", "/d.jpg"]`,
    `{"@type":"ImageObject","url":"/c.jpg"}`,
    `[{"@type":"ImageObject","contentUrl":"/c.jpg"}]`,
  ]) {
    const page = `<html><head><script type="application/ld+json">
      {"@context":"https://schema.org","@graph":[
        {"@type":"WebSite","image":"/logo.png"},
        {"@type":"Product","name":"x","image":${image}}
      ]}
    </script></head></html>`;

    assert.equal(
      parseLinkPreview(page, PAGE_URL).image_url,
      "https://shop.example/c.jpg",
      image,
    );
  }
});

test("reads the lowest price of a schema.org aggregate offer", () => {
  const page = `<html><head><script type="application/ld+json">
    {"@type":"Product","offers":{"@type":"AggregateOffer","lowPrice":"19.90","highPrice":"29.90","priceCurrency":"EUR"}}
  </script></head></html>`;

  assert.equal(parseLinkPreview(page, PAGE_URL).price_eur, 19.9);
});

test("reads a schema.org price given as a price specification", () => {
  const page = `<html><head><script type="application/ld+json">
    {"@type":"Product","offers":[{"@type":"Offer","priceSpecification":{"@type":"UnitPriceSpecification","price":34.5,"priceCurrency":"EUR"}}]}
  </script></head></html>`;

  assert.equal(parseLinkPreview(page, PAGE_URL).price_eur, 34.5);
});

test("reads price and image from microdata", () => {
  const page = `<html><body><div itemscope itemtype="https://schema.org/Product">
    <img itemprop="image" src="/e.jpg" alt="">
    <span itemprop="price" content="59.00">59,00 €</span>
    <meta itemprop="priceCurrency" content="EUR">
  </div></body></html>`;

  assert.deepEqual(parseLinkPreview(page, PAGE_URL), {
    title: null,
    price_eur: 59,
    image_url: "https://shop.example/e.jpg",
  });
});

test("reads a microdata price written as text", () => {
  const page = `<html><body><span itemprop="price">1 249,99 €</span></body></html>`;

  assert.equal(parseLinkPreview(page, PAGE_URL).price_eur, 1249.99);
});

test("ignores a microdata price in another currency", () => {
  const page = `<html><body>
    <span itemprop="price" content="59.00"></span>
    <meta itemprop="priceCurrency" content="GBP">
  </body></html>`;

  assert.equal(parseLinkPreview(page, PAGE_URL).price_eur, null);
});

test("parses the amount formats product pages actually use", () => {
  assert.equal(parseAmount("129,90"), 129.9);
  assert.equal(parseAmount("1 299,00 €"), 1299);
  assert.equal(parseAmount("1,299.00"), 1299);
  assert.equal(parseAmount("1,299"), 1299);
  assert.equal(parseAmount("$19.99"), 19.99);
  assert.equal(parseAmount(19.999), 20);
  assert.equal(parseAmount("gratuit"), null);
  assert.equal(parseAmount(undefined), null);
});

test("treats loopback, private, link-local and unique-local addresses as non-public", () => {
  for (const address of [
    "127.0.0.1",
    "127.0.0.2",
    "0.0.0.0",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.10",
    "169.254.169.254",
    "100.64.0.1",
    "::1",
    "::",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "::ffff:192.168.1.10",
    "not-an-ip",
  ]) {
    assert.equal(isPublicAddress(address), false, address);
  }

  for (const address of ["1.1.1.1", "172.32.0.1", "2606:4700::1111"]) {
    assert.equal(isPublicAddress(address), true, address);
  }
});

test("resolves a reachable page into its metadata", async () => {
  const server = await startServer(html(PRODUCT_PAGE));

  try {
    const preview = await fetchLinkPreview(server.url, {
      isAddressAllowed: ONLY_LOOPBACK,
    });

    assert.equal(preview.title, "Chaise en chêne");
    assert.equal(preview.price_eur, 129.9);
    assert.equal(preview.image_url, `${server.url}img/chaise.jpg`);
  } finally {
    await server.close();
  }
});

test("decodes a page in the charset its header declares", async () => {
  const server = await startServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=iso-8859-1" });
    res.end(Buffer.from("<title>Théière émaillée</title>", "latin1"));
  });

  try {
    const preview = await fetchLinkPreview(server.url, {
      isAddressAllowed: ONLY_LOOPBACK,
    });

    assert.equal(preview.title, "Théière émaillée");
  } finally {
    await server.close();
  }
});

test("decodes a page in the charset its meta tag declares", async () => {
  const server = await startServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(
      Buffer.from(
        '<meta http-equiv="Content-Type" content="text/html; charset=windows-1252"><title>Cafetière</title>',
        "latin1",
      ),
    );
  });

  try {
    const preview = await fetchLinkPreview(server.url, {
      isAddressAllowed: ONLY_LOOPBACK,
    });

    assert.equal(preview.title, "Cafetière");
  } finally {
    await server.close();
  }
});

test("reaches structured data at the end of a large page", async () => {
  const filler = `<div class="x">${"y".repeat(500)}</div>\n`.repeat(1000);
  const page = `<html><head><title>Lampe</title></head><body>${filler}
    <script type="application/ld+json">{"@type":"Product","image":"/f.jpg","offers":{"@type":"Offer","price":"75","priceCurrency":"EUR"}}</script>
  </body></html>`;
  const server = await startServer(html(page));

  try {
    const preview = await fetchLinkPreview(server.url, {
      isAddressAllowed: ONLY_LOOPBACK,
    });

    assert.equal(preview.price_eur, 75);
    assert.equal(preview.image_url, `${server.url}f.jpg`);
  } finally {
    await server.close();
  }
});

test("never connects to a private address", async () => {
  const server = await startServer(html(PRODUCT_PAGE));

  try {
    assert.deepEqual(await fetchLinkPreview(server.url), EMPTY_PREVIEW);
    assert.deepEqual(server.requests, []);
  } finally {
    await server.close();
  }
});

test("re-checks every hop of a redirect chain", async () => {
  const server = await startServer((req, res) => {
    res.writeHead(302, { location: "http://127.0.0.2:9/private" });
    res.end();
  });

  try {
    assert.deepEqual(
      await fetchLinkPreview(server.url, { isAddressAllowed: ONLY_LOOPBACK }),
      EMPTY_PREVIEW,
    );
    assert.deepEqual(server.requests, ["/"]);
  } finally {
    await server.close();
  }
});

test("gives up on a redirect loop instead of following it forever", async () => {
  const server = await startServer((req, res) => {
    res.writeHead(302, { location: "/next" });
    res.end();
  });

  try {
    assert.deepEqual(
      await fetchLinkPreview(server.url, { isAddressAllowed: ONLY_LOOPBACK }),
      EMPTY_PREVIEW,
    );
    assert.equal(server.requests.length, 4);
  } finally {
    await server.close();
  }
});

test("stops reading an oversized body once the head is in", async () => {
  const CHUNK = "x".repeat(64 * 1024);
  const TOTAL_CHUNKS = 200;
  let aborted: (value: boolean) => void;
  const wasAborted = new Promise<boolean>((resolve) => (aborted = resolve));

  const server = await startServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.write(PRODUCT_PAGE);
    res.on("close", () => aborted(!res.writableFinished));

    let sent = 0;
    const pump = () => {
      while (!res.destroyed && sent < TOTAL_CHUNKS) {
        sent += 1;
        if (!res.write(CHUNK)) return void res.once("drain", pump);
      }
      if (!res.destroyed) res.end();
    };
    pump();
  });

  try {
    const preview = await fetchLinkPreview(server.url, {
      isAddressAllowed: ONLY_LOOPBACK,
    });

    assert.equal(preview.title, "Chaise en chêne");
    assert.equal(await wasAborted, true);
  } finally {
    await server.close();
  }
});

test("gives up on a page that never answers", async () => {
  const server = await startServer(() => {});
  const startedAt = Date.now();

  try {
    assert.deepEqual(
      await fetchLinkPreview(server.url, {
        isAddressAllowed: ONLY_LOOPBACK,
        timeoutMs: 150,
      }),
      EMPTY_PREVIEW,
    );
    assert.ok(Date.now() - startedAt < 2000);
  } finally {
    await server.close();
  }
});

test("does not parse a response that is not HTML", async () => {
  const server = await startServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/pdf" });
    res.end(PRODUCT_PAGE);
  });

  try {
    assert.deepEqual(
      await fetchLinkPreview(server.url, { isAddressAllowed: ONLY_LOOPBACK }),
      EMPTY_PREVIEW,
    );
  } finally {
    await server.close();
  }
});

test("refuses a scheme that is not http or https", async () => {
  assert.deepEqual(await fetchLinkPreview("file:///etc/passwd"), EMPTY_PREVIEW);
  assert.deepEqual(await fetchLinkPreview("nope"), EMPTY_PREVIEW);
});
