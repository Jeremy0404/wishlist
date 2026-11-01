import crypto from "crypto";
import type { Knex } from "knex";

const SLUG_ATTEMPTS = 5;
const TOKEN_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const TOKEN_LENGTH = 4;
const MAX_NAME_LENGTH = 24;
const UNNAMED_OWNER = "liste";

function buildShareSlug(ownerName: string): string {
  const name =
    ownerName
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, MAX_NAME_LENGTH)
      .replace(/^-+|-+$/g, "") || UNNAMED_OWNER;
  const token = Array.from(
    crypto.randomBytes(TOKEN_LENGTH),
    (byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length],
  ).join("");
  return `${name}-${token}`;
}

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
