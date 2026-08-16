import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";

import express from "express";
import type { RequestHandler } from "express";

import { errorHandler } from "./error-handler.js";
import { authIpRateLimit, magicLinkAddressRateLimit } from "./rate-limit.js";

type SentMail = { to: string };

async function withServer(
  middleware: RequestHandler[],
  handler: RequestHandler,
  run: (baseUrl: string) => Promise<void>,
) {
  const app = express();
  app.use(express.json());
  app.post("/probe", ...middleware, handler);
  app.use(errorHandler);

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function postJson(baseUrl: string, body: unknown) {
  return fetch(`${baseUrl}/probe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function withEnv(vars: Record<string, string>, build: () => RequestHandler) {
  const previous = new Map(
    Object.keys(vars).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, vars);
  try {
    return build();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("the per-IP limiter answers 429 once the max is spent", async () => {
  const limiter = withEnv(
    { AUTH_RATE_LIMIT_MAX: "2", AUTH_RATE_LIMIT_WINDOW_MS: "60000" },
    authIpRateLimit,
  );

  await withServer(
    [limiter],
    (_req, res) => res.json({ ok: true }),
    async (baseUrl) => {
      const statuses: number[] = [];
      let throttledBody: unknown;
      for (let i = 0; i < 3; i += 1) {
        const res = await postJson(baseUrl, { email: "jeremy@example.com" });
        statuses.push(res.status);
        if (res.status === 429) throttledBody = await res.json();
      }

      assert.deepEqual(statuses, [200, 200, 429]);
      assert.deepEqual(throttledBody, {
        code: "TOO_MANY_REQUESTS",
        message: "too many requests",
      });
    },
  );
});

test("the per-address limiter answers 200 {ok:true} and sends no mail past the max", async () => {
  const limiter = withEnv(
    {
      MAGIC_LINK_RATE_LIMIT_MAX: "2",
      MAGIC_LINK_RATE_LIMIT_WINDOW_MS: "60000",
    },
    magicLinkAddressRateLimit,
  );

  const sent: SentMail[] = [];

  await withServer(
    [limiter],
    (req, res) => {
      sent.push({ to: req.body.email });
      res.json({ ok: true });
    },
    async (baseUrl) => {
      const bodies: unknown[] = [];
      const statuses: number[] = [];
      for (let i = 0; i < 3; i += 1) {
        const res = await postJson(baseUrl, { email: "jeremy@example.com" });
        statuses.push(res.status);
        bodies.push(await res.json());
      }

      assert.deepEqual(statuses, [200, 200, 200]);
      assert.deepEqual(bodies, [{ ok: true }, { ok: true }, { ok: true }]);
      assert.equal(sent.length, 2);
    },
  );
});

test("the throttled answer carries no rate-limit header to count down", async () => {
  const limiter = withEnv(
    {
      MAGIC_LINK_RATE_LIMIT_MAX: "1",
      MAGIC_LINK_RATE_LIMIT_WINDOW_MS: "60000",
    },
    magicLinkAddressRateLimit,
  );

  await withServer(
    [limiter],
    (_req, res) => res.json({ ok: true }),
    async (baseUrl) => {
      await postJson(baseUrl, { email: "jeremy@example.com" });
      const throttled = await postJson(baseUrl, {
        email: "jeremy@example.com",
      });

      for (const header of [
        "ratelimit",
        "ratelimit-limit",
        "ratelimit-remaining",
        "ratelimit-reset",
        "ratelimit-policy",
        "retry-after",
        "x-ratelimit-limit",
      ]) {
        assert.equal(throttled.headers.get(header), null, header);
      }
    },
  );
});

test("the per-address limiter buckets on the normalized address", async () => {
  const limiter = withEnv(
    {
      MAGIC_LINK_RATE_LIMIT_MAX: "1",
      MAGIC_LINK_RATE_LIMIT_WINDOW_MS: "60000",
    },
    magicLinkAddressRateLimit,
  );

  const sent: SentMail[] = [];

  await withServer(
    [limiter],
    (req, res) => {
      sent.push({ to: req.body.email });
      res.json({ ok: true });
    },
    async (baseUrl) => {
      await postJson(baseUrl, { email: "jeremy@example.com" });
      await postJson(baseUrl, { email: "  Jeremy@Example.COM " });
      await postJson(baseUrl, { email: "someone-else@example.com" });

      assert.deepEqual(
        sent.map((mail) => mail.to),
        ["jeremy@example.com", "someone-else@example.com"],
      );
    },
  );
});

test("a body without an address is left to the route's own validation", async () => {
  const limiter = withEnv(
    {
      MAGIC_LINK_RATE_LIMIT_MAX: "1",
      MAGIC_LINK_RATE_LIMIT_WINDOW_MS: "60000",
    },
    magicLinkAddressRateLimit,
  );

  await withServer(
    [limiter],
    (_req, res) => res.status(400).json({ error: "invalid" }),
    async (baseUrl) => {
      const statuses: number[] = [];
      for (let i = 0; i < 3; i += 1) {
        const res = await postJson(baseUrl, {});
        statuses.push(res.status);
      }

      assert.deepEqual(statuses, [400, 400, 400]);
    },
  );
});
