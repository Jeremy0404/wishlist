import crypto from "crypto";

const TOKEN_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const TOKEN_LENGTH = 4;
const MAX_NAME_LENGTH = 24;
const UNNAMED_OWNER = "liste";

export function slugifyOwnerName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_NAME_LENGTH)
    .replace(/^-+|-+$/g, "");

  return slug || UNNAMED_OWNER;
}

function randomToken(): string {
  return Array.from(
    crypto.randomBytes(TOKEN_LENGTH),
    (byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length],
  ).join("");
}

export function buildShareSlug(ownerName: string): string {
  return `${slugifyOwnerName(ownerName)}-${randomToken()}`;
}
