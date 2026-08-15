import type { Knex } from "knex";
import { buildShareSlug } from "../src/share-slug.js";

const SLUG_ATTEMPTS = 5;

export async function up(knex: Knex): Promise<void> {
  const taken = new Set<string>(
    await knex("wishlists").whereNotNull("public_slug").pluck("public_slug"),
  );

  const unslugged = await knex("wishlists as w")
    .join("users as u", "u.id", "w.user_id")
    .whereNull("w.public_slug")
    .select("w.id", "u.name");

  for (const { id, name } of unslugged) {
    let slug = buildShareSlug(name);
    for (let i = 1; i < SLUG_ATTEMPTS && taken.has(slug); i += 1) {
      slug = buildShareSlug(name);
    }
    if (taken.has(slug)) throw new Error(`unable to mint a slug for ${id}`);

    taken.add(slug);
    await knex("wishlists").where({ id }).update({ public_slug: slug });
  }

  await knex.schema.alterTable("wishlists", (t) => {
    t.string("public_slug").notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wishlists", (t) => {
    t.string("public_slug").nullable().alter();
  });

  await knex("wishlists")
    .whereNull("published_at")
    .update({ public_slug: null });
}
