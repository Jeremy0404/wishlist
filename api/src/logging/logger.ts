import type { Request } from "express";
import pino, { LoggerOptions } from "pino";

const isProd = process.env.NODE_ENV === "production";
const pretty =
  (process.env.LOG_PRETTY ?? (isProd ? "false" : "true")) === "true";

const base: LoggerOptions["base"] = {
  service: process.env.npm_package_name ?? "wishlist-api",
  env: process.env.NODE_ENV ?? "development",
  version: process.env.npm_package_version,
};

const redact: LoggerOptions["redact"] = {
  paths: [
    // headers & common auth fields
    "req.headers.authorization",
    "req.headers.cookie",
    "headers.authorization",
    "authorization",
    "cookie",
    // bodies / payloads
    "*.password",
    "*.token",
    "*.jwt",
    "*.secret",
    "password",
    "token",
    "jwt",
    "secret",
  ],
  censor: "[REDACTED]",
  remove: false,
};

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base,
  redact,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: pretty
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname,version,env,service",
        },
      }
    : undefined,
});

export function getChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

export function getRequestLogger(
  req: Request,
  bindings: Record<string, unknown> = {},
) {
  const requestId = (req as any)?.id;
  const userId = req?.user?.id;
  const familyId = (req as any)?.familyId;

  const base = (req as any)?.log ?? logger;

  return base.child({ requestId, userId, familyId, ...bindings });
}
