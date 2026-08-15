import { NextFunction, Request, Response } from "express";
import { authCookie, verifyToken } from "../auth/jwt.js";
import { db } from "../db/knex.js";
import { ForbiddenError, UnauthorizedError } from "../errors.js";

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[authCookie.name];
  const user = token ? verifyToken(token) : null;
  if (!user) return next(new UnauthorizedError("unauthorized"));
  req.user = user;
  next();
}

/** Resolves the caller's family when they have one. Having none is not an error:
 *  a family-less user still owns a private wishlist. */
export async function familyContext(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user) return next(new UnauthorizedError("unauthorized"));

  try {
    const memb = await db("family_memberships")
      .where({ user_id: req.user.id })
      .first();

    req.familyId = memb?.family_id ?? null;
    next();
  } catch (err) {
    next(err);
  }
}

/** Gate for the endpoints that only mean something inside a family:
 *  browsing other lists, and reserving. */
export function familyRequired(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user) return next(new UnauthorizedError("unauthorized"));
  if (!req.familyId) return next(new ForbiddenError("not in a family"));
  next();
}
