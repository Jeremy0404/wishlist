import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wishlist_items", (t) => {
    t.decimal("price_eur", 10, 2).nullable(); // laisse nullable pour compat
  });

  await knex.raw(`
    UPDATE wishlist_items
    SET price_eur = CASE
      WHEN price_cents IS NULL THEN NULL
      ELSE ROUND(price_cents::numeric / 100.0, 2)
    END
  `);

  const hasCurrency = await knex.schema.hasColumn("wishlist_items", "currency");
  if (hasCurrency) {
    await knex.schema.alterTable("wishlist_items", (t) => {
      t.dropColumn("currency");
    });
  }

  const hasCents = await knex.schema.hasColumn("wishlist_items", "price_cents");
  if (hasCents) {
    await knex.schema.alterTable("wishlist_items", (t) => {
      t.dropColumn("price_cents");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wishlist_items", (t) => {
    t.integer("price_cents").nullable();
    t.string("currency", 3).notNullable().defaultTo("EUR");
  });

  await knex.raw(`
    UPDATE wishlist_items
    SET price_cents = CASE
      WHEN price_eur IS NULL THEN NULL
      ELSE ROUND(price_eur::numeric * 100.0, 0)::int
    END
  `);

  await knex.schema.alterTable("wishlist_items", (t) => {
    t.dropColumn("price_eur");
  });
}
