import { Router } from "express";
import { z } from "zod";
import type { Knex } from "knex";
import bcrypt from "bcryptjs";
import { db } from "../db/knex.js";
import { authCookie, signUser } from "../auth/jwt.js";
import {
  buildMagicLinkUrl,
  consumeMagicLink,
  findOrCreateUserByEmail,
  issueMagicLink,
  normalizeEmail,
} from "../auth/magic-link.js";
import { magicLinkEmail } from "../mail/magic-link-email.js";
import { sendMail } from "../mail/mailer.js";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import {
  authIpRateLimit,
  magicLinkAddressRateLimit,
} from "../middleware/rate-limit.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors.js";
import { getRequestLogger } from "../logging/logger.js";

const router = Router();

const ipRateLimit = authIpRateLimit();
const addressRateLimit = magicLinkAddressRateLimit();

const Register = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

router.post(
  "/register",
  ipRateLimit,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "auth", action: "register" });
    const parse = Register.safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);
    const { email, password, name } = parse.data;

    const existing = await db("users").where({ email }).first();
    if (existing) throw new ConflictError("email already used");

    const password_hash = await bcrypt.hash(password, 10);
    const [user] = await db("users")
      .insert({ email, password_hash, name })
      .returning(["id", "email", "name"]);

    log.info({ userId: user.id, email: user.email }, "User registered");

    const token = signUser({ id: user.id, email: user.email });
    res
      .cookie(authCookie.name, token, authCookie.options)
      .json({ id: user.id, email: user.email, name: user.name });
  }),
);

const Login = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post(
  "/login",
  ipRateLimit,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "auth", action: "login" });
    const parse = Login.safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);
    const { email, password } = parse.data;

    const user = await db("users").where({ email }).first();
    if (!user) {
      log.warn({ email }, "Login attempt for unknown user");
      throw new UnauthorizedError("invalid credentials");
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      log.warn({ userId: user.id }, "Login attempt with bad password");
      throw new UnauthorizedError("invalid credentials");
    }

    log.info({ userId: user.id }, "User logged in");

    const token = signUser({ id: user.id, email: user.email });
    res
      .cookie(authCookie.name, token, authCookie.options)
      .json({ id: user.id, email: user.email, name: user.name });
  }),
);

const MagicLinkRequest = z.object({
  email: z.string().email(),
});

/** The answer never depends on whether the address has an account: signing in
 *  and signing up are the same act, so there is nothing to enumerate. */
router.post(
  "/magic-link",
  ipRateLimit,
  addressRateLimit,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "auth",
      action: "magic-link-request",
    });
    const parse = MagicLinkRequest.safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);

    const email = normalizeEmail(parse.data.email);
    const token = await issueMagicLink(db, email);
    await sendMail(magicLinkEmail(email, buildMagicLinkUrl(token)));

    log.info({ email }, "Magic link issued");
    res.json({ ok: true });
  }),
);

const MagicLinkConsume = z.object({
  token: z.string().min(1),
});

router.post(
  "/magic-link/consume",
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "auth",
      action: "magic-link-consume",
    });
    const parse = MagicLinkConsume.safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);

    const email = await consumeMagicLink(db, parse.data.token);
    if (!email) {
      log.warn("Magic link rejected: unknown, spent or expired");
      throw new UnauthorizedError("invalid or expired link");
    }

    const { user, created } = await findOrCreateUserByEmail(db, email);
    log.info({ userId: user.id, created }, "User signed in with a magic link");

    const token = signUser({ id: user.id, email: user.email });
    res
      .cookie(authCookie.name, token, authCookie.options)
      .json({ id: user.id, email: user.email, name: user.name, created });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    const log = getRequestLogger(_req, { module: "auth", action: "logout" });
    log.info({ userId: _req.user?.id }, "User logged out");
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

const NAME_MAX_LENGTH = 80;

const ProfileUpdate = z.object({
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH),
});

export async function updateUserName(
  dbConn: Knex,
  userId: string,
  name: string,
) {
  const [user] = await dbConn("users")
    .where({ id: userId })
    .update({ name })
    .returning(["id", "email", "name"]);

  return user ?? null;
}

/** The row updated is the caller's own, taken from the session — never an id
 *  the request gets to name. */
router.patch(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "auth", action: "rename" });
    const parse = ProfileUpdate.safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);

    const user = await updateUserName(db, req.user!.id, parse.data.name);
    if (!user) throw new NotFoundError("user not found");

    log.info({ userId: user.id }, "User changed their display name");
    res.json(user);
  }),
);

export default router;
