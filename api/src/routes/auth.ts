import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../db/knex.js";
import { authCookie, signUser } from "../auth/jwt.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

const Register = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

router.post("/register", async (req, res) => {
  const parse = Register.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  const { email, password, name } = parse.data;

  const existing = await db("users").where({ email }).first();
  if (existing) return res.status(409).json({ error: "email already used" });

  const password_hash = await bcrypt.hash(password, 10);
  const [user] = await db("users")
    .insert({ email, password_hash, name })
    .returning(["id", "email"]);

  const token = signUser({ id: user.id, email: user.email });
  res
    .cookie(authCookie.name, token, authCookie.options)
    .json({ id: user.id, email: user.email });
});

const Login = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/login", async (req, res) => {
  const parse = Login.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  const { email, password } = parse.data;

  const user = await db("users").where({ email }).first();
  if (!user) return res.status(401).json({ error: "invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  const token = signUser({ id: user.id, email: user.email });
  res
    .cookie(authCookie.name, token, authCookie.options)
    .json({ id: user.id, email: user.email });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(authCookie.name, { ...authCookie.options, maxAge: 0 });
  res.json({ ok: true });
});

router.get("/me", authRequired, async (req, res) => {
  const u = await db("users")
    .select("id", "email", "name")
    .where({ id: req.user!.id })
    .first();
  if (!u) return res.status(404).json({ error: "not found" });
  res.json(u);
});

export default router;
