// api/knexfile.cjs
require("dotenv").config();

/** @type {import('knex').Knex.Config} */
module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 0, max: 10 },
  migrations: {
    directory: "./migrations",
    extension: "ts",
    tableName: "knex_migrations",
  },
};
