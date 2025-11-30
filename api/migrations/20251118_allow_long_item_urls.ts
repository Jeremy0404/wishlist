import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wishlist_items", (t) => {
    t.text("url").alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wishlist_items", (t) => {
    t.string("url").alter();
  });
}
