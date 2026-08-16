import { rateLimit } from "express-rate-limit";
import type { RequestHandler } from "express";

import { normalizeEmail } from "../auth/magic-link.js";
import { TooManyRequestsError } from "../errors.js";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const DEFAULT_AUTH_MAX_PER_IP = 10;
const DEFAULT_MAGIC_LINK_MAX_PER_ADDRESS = 3;

function positiveIntFromEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function authIpRateLimit(): RequestHandler {
  return rateLimit({
    windowMs: positiveIntFromEnv(
      "AUTH_RATE_LIMIT_WINDOW_MS",
      FIFTEEN_MINUTES_MS,
    ),
    limit: positiveIntFromEnv("AUTH_RATE_LIMIT_MAX", DEFAULT_AUTH_MAX_PER_IP),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new TooManyRequestsError()),
  });
}

/** Throttling an address must stay invisible: the answer is the one a delivered
 *  link gets, and no header counts down, so nobody learns the address was asked
 *  for recently. A body without an address is left to the route's validation. */
export function magicLinkAddressRateLimit(): RequestHandler {
  return rateLimit({
    windowMs: positiveIntFromEnv(
      "MAGIC_LINK_RATE_LIMIT_WINDOW_MS",
      FIFTEEN_MINUTES_MS,
    ),
    limit: positiveIntFromEnv(
      "MAGIC_LINK_RATE_LIMIT_MAX",
      DEFAULT_MAGIC_LINK_MAX_PER_ADDRESS,
    ),
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req) => typeof req.body?.email !== "string",
    keyGenerator: (req) => normalizeEmail(req.body.email),
    handler: (_req, res) => {
      res.json({ ok: true });
    },
  });
}
