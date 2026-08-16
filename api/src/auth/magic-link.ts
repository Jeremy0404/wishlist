import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Knex } from "knex";

export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
export const MAGIC_LINK_TTL_MINUTES = MAGIC_LINK_TTL_MS / 60_000;
export const MAGIC_LINK_PATH = "/auth/magic";

const TOKEN_BYTES = 32;
const DEFAULT_APP_URL = "http://localhost:5173";
const UNNAMED_USER = "Invité";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Only the digest is stored: a dump of the table grants nobody a session. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function mintToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function buildMagicLinkUrl(token: string): string {
  const url = new URL(
    MAGIC_LINK_PATH,
    process.env.APP_URL ?? DEFAULT_APP_URL,
  );
  url.searchParams.set("token", token);
  return url.toString();
}

/** Issuing drops whatever was outstanding, so a mailbox never holds two usable
 *  links at once. */
export async function issueMagicLink(
  dbConn: Knex,
  email: string,
  now = new Date(),
): Promise<string> {
  const token = mintToken();

  await dbConn("magic_link_tokens").where({ email }).del();
  await dbConn("magic_link_tokens").insert({
    email,
    token_hash: hashToken(token),
    expires_at: new Date(now.getTime() + MAGIC_LINK_TTL_MS),
  });

  return token;
}

/** Marking consumed and reading the address happen in one statement, so two
 *  simultaneous redemptions cannot both win. */
export async function consumeMagicLink(
  dbConn: Knex,
  token: string,
  now = new Date(),
): Promise<string | null> {
  const rows = await dbConn("magic_link_tokens")
    .where({ token_hash: hashToken(token) })
    .whereNull("consumed_at")
    .where("expires_at", ">", now)
    .update({ consumed_at: now })
    .returning("email");

  return rows[0]?.email ?? null;
}

/** A magic-link sign-up never asks for a name — the address is all the screen
 *  collects. */
export function displayNameFromEmail(email: string): string {
  const words = email
    .split("@")[0]
    .split(/[._+-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1));

  return words.join(" ") || UNNAMED_USER;
}

/** Signing in and signing up are the same act, so an unknown address becomes an
 *  account with a password nobody can hold — the password flow stays a
 *  registration-time choice. */
export async function findOrCreateUserByEmail(dbConn: Knex, email: string) {
  const existing = await dbConn("users")
    .select("id", "email")
    .whereRaw("lower(email) = ?", [email])
    .first();
  if (existing) return { user: existing, created: false };

  const password_hash = await bcrypt.hash(
    crypto.randomBytes(TOKEN_BYTES).toString("hex"),
    10,
  );
  const [user] = await dbConn("users")
    .insert({ email, password_hash, name: displayNameFromEmail(email) })
    .returning(["id", "email"]);

  return { user, created: true };
}
