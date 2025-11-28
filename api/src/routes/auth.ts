import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../db/knex.js";
import { authCookie, signUser } from "../auth/jwt.js";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors.js";

const router = Router();

const Register = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parse = Register.safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);
    const { email, password, name } = parse.data;

    const existing = await db("users").where({ email }).first();
    if (existing) throw new ConflictError("email already used");

    const password_hash = await bcrypt.hash(password, 10);
    const [user] = await db("users")
      .insert({ email, password_hash, name })
      .returning(["id", "email"]);

    const token = signUser({ id: user.id, email: user.email });
    res
      .cookie(authCookie.name, token, authCookie.options)
      .json({ id: user.id, email: user.email });
  }),
);

const Login = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parse = Login.safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);
    const { email, password } = parse.data;

    const user = await db("users").where({ email }).first();
    if (!user) throw new UnauthorizedError("invalid credentials");

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new UnauthorizedError("invalid credentials");

    const token = signUser({ id: user.id, email: user.email });
    res
      .cookie(authCookie.name, token, authCookie.options)
      .json({ id: user.id, email: user.email });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    res.clearCookie(authCookie.name, { ...authCookie.options, maxAge: 0 });
    res.json({ ok: true });
  }),
);

router.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    const u = await db("users")
      .select("id", "email", "name")
      .where({ id: req.user!.id })
      .first();
    if (!u) throw new NotFoundError("user not found");
    res.json(u);
  }),
);

export default router;
