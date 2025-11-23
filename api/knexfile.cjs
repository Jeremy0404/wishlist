require("dotenv").config();

/** @type {import('knex').Knex.Config} */
module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  migrations: {
    directory:
      process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test"
        ? "./dist/migrations"
        : "./migrations",
    extension: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test" ? "js" : "ts",
  },
};
