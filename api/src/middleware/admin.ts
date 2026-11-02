import type { NextFunction, Request, Response } from "express";
import type { Knex } from "knex";
import { normalizeEmail } from "../auth/magic-link.js";
import { db } from "../db/knex.js";
import { ForbiddenError, UnauthorizedError } from "../errors.js";

export function parseAdminEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "").split(",").map(normalizeEmail).filter(Boolean),
  );
}

const ADMIN_EMAILS = parseAdminEmails(process.env.ADMIN_EMAILS);

export function isAdminEmail(
  email: string | null | undefined,
  admins = ADMIN_EMAILS,
): boolean {
  return Boolean(email) && admins.has(normalizeEmail(email!));
}

/** The email is read from the database on every request, never from the
 *  session, so an edited address or a shortened ADMIN_EMAILS applies at once. */
export function adminRequired(dbConn: Knex = db, admins = ADMIN_EMAILS) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError("unauthorized"));

    try {
      const user = await dbConn("users")
        .select("email")
        .where({ id: req.user.id })
        .first();

      if (!isAdminEmail(user?.email, admins))
        return next(new ForbiddenError("admin only"));
      next();
    } catch (err) {
      next(err);
    }
  };
}
