import type { Knex } from "knex";

const NO_FAMILY_INDEX = "wishlists_user_no_family_unique";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wishlists", (t) => {
    t.uuid("family_id").nullable().alter();
  });

  await knex.raw(
    `CREATE UNIQUE INDEX IF NOT EXISTS ${NO_FAMILY_INDEX}
       ON wishlists (user_id) WHERE family_id IS NULL;`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${NO_FAMILY_INDEX};`);
  await knex("wishlists").whereNull("family_id").del();

  await knex.schema.alterTable("wishlists", (t) => {
    t.uuid("family_id").notNullable().alter();
  });
}
