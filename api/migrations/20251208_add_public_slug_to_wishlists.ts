import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wishlists", (t) => {
    t.string("public_slug").unique();
    t.timestamp("published_at", { useTz: true });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wishlists", (t) => {
    t.dropColumn("public_slug");
    t.dropColumn("published_at");
  });
}
