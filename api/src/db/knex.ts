import "dotenv/config";
import pg from "pg";
import knex, { type Knex } from "knex";

pg.types.setTypeParser(1700, (v: string | null) =>
  v === null ? null : Number.parseFloat(v),
);

const config: Knex.Config = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 0, max: 10 },
  migrations: { tableName: "knex_migrations" },
};

export const db = knex(config);
