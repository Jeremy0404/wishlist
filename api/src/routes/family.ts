import { Router } from "express";
import { z } from "zod";
import { db } from "../db/knex.js";
import { authRequired, familyContext } from "../middleware/auth.js";
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

    log.info({ familyId: family.id }, "User joined family");
    return res.status(200).json(family);
  }),
);

router.get(
  "/members",
  authRequired,
  familyContext,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "family", action: "list-members" });

    const hasMembershipCreatedAt = await db.schema.hasColumn(
      "family_memberships",
      "created_at",
    );

    const joinedAtField = hasMembershipCreatedAt
      ? db.raw("?? as joined_at", ["fm.created_at"])
      : db.raw("?? as joined_at", ["u.created_at"]);

    const orderByField = hasMembershipCreatedAt ? "fm.created_at" : "u.created_at";

    const members = await db("family_memberships as fm")
      .join("users as u", "u.id", "fm.user_id")
      .select("u.id", "u.name", "fm.role", joinedAtField)
      .where("fm.family_id", req.familyId)
      .orderBy(orderByField, "asc");

    log.info(
      { familyId: req.familyId, memberCount: members.length },
      "Returned family members",
    );
    return res.json(members);
  }),
);

router.post(
  "/rotate-invite",
  authRequired,
  familyContext,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "family", action: "rotate-invite" });

    const family = await db("families")
      .select("id", "name")
      .where({ id: req.familyId })
      .first();

    if (!family) throw new NotFoundError("Famille introuvable");

    let invite_code: string;
    let attempts = 0;

    let foundUnique = false;

    do {
      invite_code = generateInviteCode(family.name);
      const existing = await db("families").where({ invite_code }).first();
      if (!existing) {
        foundUnique = true;
        break;
      }
      attempts += 1;
    } while (attempts < 5);

    if (!invite_code || !foundUnique)
      throw new Error("Impossible de générer un code unique");

    const [updatedFamily] = await db("families")
      .where({ id: family.id })
      .update({ invite_code })
      .returning(["id", "name", "invite_code"]);

    log.info({ familyId: family.id }, "Rotated invite code");

    return res.json(updatedFamily);
  }),
);

export default router;
