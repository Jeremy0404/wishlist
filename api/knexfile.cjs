require("dotenv").config();

/** @type {import('knex').Knex.Config} */
module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  migrations: {
    directory:
      process.env.NODE_ENV === "production"
        ? "./dist/migrations"
        : "./migrations",
    extension: process.env.NODE_ENV === "production" ? "js" : "ts",
  },
};
