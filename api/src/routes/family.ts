// api/src/routes/family.ts
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/knex.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

const createFamilySchema = z.object({
  name: z.string().min(1, "Nom requis").max(120),
});

const joinFamilySchema = z.object({
  code: z.string().min(1, "Code requis").max(120),
});

router.get("/me", authRequired, async (req, res) => {
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
});

function generateInviteCode(name: string) {
  const ascii = name
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^A-Za-z0-9]/g, "");

  const prefix = ascii.slice(0, 3).toUpperCase().padEnd(3, "X");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${prefix}-${suffix}`;
}

router.post("/", authRequired, async (req, res) => {
  const parse = createFamilySchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: "Données invalides" });

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
});

router.post("/join", authRequired, async (req, res) => {
  const parsed = joinFamilySchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Données invalides" });

  const code = String(parsed.data.code).trim().toUpperCase();

  console.info(`POST /family/join - [${code}] (len=${code.length})`);
  try {
    const family = await db("families")
      .select("id", "name", "invite_code")
      .whereRaw("upper(trim(invite_code)) = ?", [code])
      .first()
      .debug(true);

    if (!family)
      return res.status(404).json({ error: "Code d’invitation invalide" });

    await db("family_memberships")
      .insert({ user_id: req.user!.id, family_id: family.id })
      .onConflict(["user_id"])
      .merge({ family_id: family.id });

    return res.status(200).json(family);
  } catch (e) {
    console.error("POST /family/join error:", e);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
