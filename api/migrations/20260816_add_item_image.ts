import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wishlist_items", (t) => {
    t.text("image_url");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wishlist_items", (t) => {
    t.dropColumn("image_url");
  });
}
