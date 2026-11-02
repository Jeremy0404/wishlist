import type { Knex } from "knex";

const SINGLE_ROW = "app_settings_single_row";
const NON_NEGATIVE_THRESHOLD = "app_settings_min_items_to_view_non_negative";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("app_settings", (t) => {
    t.smallint("id").primary().defaultTo(1);
    t.integer("min_items_to_view").notNullable().defaultTo(0);
    t.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(
    `ALTER TABLE app_settings ADD CONSTRAINT ${SINGLE_ROW} CHECK (id = 1);`,
  );
  await knex.raw(
    `ALTER TABLE app_settings ADD CONSTRAINT ${NON_NEGATIVE_THRESHOLD}
       CHECK (min_items_to_view >= 0);`,
  );

  await knex("app_settings").insert({ id: 1 });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("app_settings");
}
