import { Router } from "express";
import type { Knex } from "knex";
import { z } from "zod";
import { db } from "../db/knex.js";
import {
  authRequired,
  familyContext,
  familyRequired,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { NotFoundError, ValidationError } from "../errors.js";
import { getRequestLogger } from "../logging/logger.js";

const router = Router();

const createFamilySchema = z.object({
  name: z.string().min(1, "Nom requis").max(120),
});

const joinFamilySchema = z.object({
  code: z.string().min(1, "Code requis").max(120),
});

router.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "family", action: "get-current" });
    const member = await db("family_memberships")
      .select("family_id")
      .where({ user_id: req.user!.id })
      .first();

    if (!member) {
      log.info("User not part of a family");
      return res.json(null);
    }

    const fam = await db("families")
      .select("id", "name", "invite_code")
      .where({ id: member.family_id })
      .first();

    log.info(
      { familyId: fam?.id ?? member.family_id },
      fam ? "Returning family" : "Family missing despite membership",
    );
    return res.json(fam ?? null);
  }),
);

export function generateInviteCode(name: string) {
  const ascii = name
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^A-Za-z0-9]/g, "");

  const prefix = ascii.slice(0, 3).toUpperCase().padEnd(3, "X");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${prefix}-${suffix}`;
}

/** A user who filled their list before joining keeps it: the family-less wishlist
 *  becomes the family one, unless they already have a list in that family. */
export async function adoptFamilylessWishlist(
  dbConn: Knex,
  userId: string,
  familyId: string,
) {
  const existing = await dbConn("wishlists")
    .where({ user_id: userId, family_id: familyId })
    .first();
  if (existing) return;

  await dbConn("wishlists")
    .where({ user_id: userId })
    .whereNull("family_id")
    .update({ family_id: familyId });
}

router.post(
  "/",
  authRequired,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "family", action: "create" });
    const parse = createFamilySchema.safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);

    const { name } = parse.data;
    const invite_code = generateInviteCode(name);

    const [fam] = await db("families")
      .insert({ name, invite_code })
      .returning(["id", "name", "invite_code"]);

    await db("family_memberships")
      .insert({ user_id: req.user!.id, family_id: fam.id })
      .onConflict(["user_id"])
      .merge({ family_id: fam.id });

    await adoptFamilylessWishlist(db, req.user!.id, fam.id);

    log.info({ familyId: fam.id }, "Created family and added creator");
    res.status(201).json(fam);
  }),
);

router.post(
  "/join",
  authRequired,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "family", action: "join" });
    const parsed = joinFamilySchema.safeParse(req.body);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);

    const code = String(parsed.data.code).trim().toUpperCase();

    const family = await db("families")
      .select("id", "name", "invite_code")
      .whereRaw("upper(trim(invite_code)) = ?", [code])
      .first();

    if (!family) throw new NotFoundError("Code d’invitation invalide");

    await db("family_memberships")
      .insert({ user_id: req.user!.id, family_id: family.id })
      .onConflict(["user_id"])
      .merge({ family_id: family.id });

    await adoptFamilylessWishlist(db, req.user!.id, family.id);

    log.info({ familyId: family.id }, "User joined family");
    return res.status(200).json(family);
  }),
);

router.get(
  "/members",
  authRequired,
  familyContext,
  familyRequired,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "family", action: "list-members" });

    const members = await listFamilyMembers(db, req.familyId!);

    log.info(
      { familyId: req.familyId, memberCount: members.length },
      "Returned family members",
    );
    return res.json(members);
  }),
);

const INVITE_CODE_ATTEMPTS = 5;

/** The old code stops working at once: a link already sent no longer joins. */
export async function rotateInviteCode(dbConn: Knex, familyId: string) {
  const family = await dbConn("families")
    .select("id", "name")
    .where({ id: familyId })
    .first();
  if (!family) throw new NotFoundError("Famille introuvable");

  for (let attempt = 0; attempt < INVITE_CODE_ATTEMPTS; attempt += 1) {
    const invite_code = generateInviteCode(family.name);
    const taken = await dbConn("families").where({ invite_code }).first();
    if (taken) continue;

    const [updated] = await dbConn("families")
      .where({ id: family.id })
      .update({ invite_code })
      .returning(["id", "name", "invite_code"]);
    return updated;
  }

  throw new Error("Impossible de générer un code unique");
}

export default router;

export async function listFamilyMembers(dbConn: Knex, familyId: string) {
  const hasMembershipCreatedAt = await dbConn.schema.hasColumn(
    "family_memberships",
    "created_at",
  );

  const joinedAtField = hasMembershipCreatedAt
    ? dbConn.raw("?? as joined_at", ["fm.created_at"])
    : dbConn.raw("?? as joined_at", ["u.created_at"]);

  const orderByField = hasMembershipCreatedAt ? "fm.created_at" : "u.created_at";

  return dbConn("family_memberships as fm")
    .join("users as u", "u.id", "fm.user_id")
    .select("u.id", "u.name", "fm.role", joinedAtField)
    .where("fm.family_id", familyId)
    .orderBy(orderByField, "asc");
}
