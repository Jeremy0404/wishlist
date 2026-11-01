import type { Knex } from "knex";

const USERNAME_FORMAT = "users_username_format";
const EMAIL_OR_USERNAME = "users_email_or_username";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (t) => {
    t.string("username").unique();
    t.string("email").nullable().alter();
  });

  await knex.raw(
    `ALTER TABLE users ADD CONSTRAINT ${USERNAME_FORMAT}
       CHECK (username ~ '^[a-z0-9._-]{3,32}$');`,
  );
  await knex.raw(
    `ALTER TABLE users ADD CONSTRAINT ${EMAIL_OR_USERNAME}
       CHECK (email IS NOT NULL OR username IS NOT NULL);`,
  );
}

export async function down(knex: Knex): Promise<void> {
  const withoutEmail = await knex("users").whereNull("email").first();
  if (withoutEmail)
    throw new Error("Some accounts have no email: delete them before rolling back");

  await knex.raw(`ALTER TABLE users DROP CONSTRAINT ${EMAIL_OR_USERNAME};`);
  await knex.raw(`ALTER TABLE users DROP CONSTRAINT ${USERNAME_FORMAT};`);

  await knex.schema.alterTable("users", (t) => {
    t.dropColumn("username");
    t.string("email").notNullable().alter();
  });
}
