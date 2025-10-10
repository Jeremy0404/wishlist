import "dotenv/config";
import pg from "pg";
import knex, { Knex } from "knex";
import { logger } from "../logging/logger.js";
import config from "./knexConfig.js";

const log = logger.child({ module: "db" }, { level: "debug" });

pg.types.setTypeParser(1700, (v: string | null) =>
  v === null ? null : Number.parseFloat(v),
);

export const db = knex(config);

const enableQueryLogs =
  (process.env.LOG_ENABLE_DB_QUERIES ?? "false") === "true";

if (enableQueryLogs) {
  instrumentKnex(db, log);
}

function instrumentKnex(db: Knex, log: any) {
  attach(db, log);
  if (db.client) attach((db as any).client, log);
}

function attach(emitter: any, log: any) {
  if (!emitter?.on) return;

  if (emitter.__loggingAttached) return;
  Object.defineProperty(emitter, "__loggingAttached", { value: true });

  emitter.on("query", (q: any) => {
    log.debug({ sql: q.sql, bindings: safeBindings(q.bindings) }, "DB query");
  });

  emitter.on("query-response", (_res: unknown, q: any) => {
    log.trace({ sql: q?.sql }, "DB query response");
  });

  emitter.on("query-error", (err: any, q: any) => {
    log.error({ err, sql: q?.sql }, "DB query error");
  });
}

function safeBindings(bindings: unknown) {
  if (!Array.isArray(bindings)) return bindings;
  return bindings.map((v) => {
    if (typeof v !== "string") return v;
    if (v.includes("@") || v.length > 64) return "[REDACTED]";
    return v;
  });
}
