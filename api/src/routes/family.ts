import { Router } from "express";
import { z } from "zod";
import { db } from "../db/knex.js";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { NotFoundError, ValidationError } from "../errors.js";

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
    const member = await db("family_memberships")
      .select("family_id")
      .where({ user_id: req.user!.id })
      .first();

    if (!member) return res.json(null);

    const fam = await db("families")
      .select("id", "name", "invite_code")
      .where({ id: member.family_id })
      .first();

    return res.json(fam ?? null);
  }),
);

function generateInviteCode(name: string) {
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

    res.status(201).json(fam);
  }),
);

router.post(
  "/join",
  authRequired,
  asyncHandler(async (req, res) => {
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

    return res.status(200).json(family);
  }),
);

export default router;
