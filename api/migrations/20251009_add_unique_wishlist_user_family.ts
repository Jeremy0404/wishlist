import type { Knex } from "knex";

const INDEX_NAME = "wishlists_user_family_unique";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS ${INDEX_NAME}
       ON wishlists (user_id, family_id);`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX CONCURRENTLY IF EXISTS ${INDEX_NAME};`);
}
