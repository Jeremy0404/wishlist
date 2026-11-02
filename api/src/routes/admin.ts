import { Router } from "express";
import type { Knex } from "knex";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db/knex.js";
import { adminRequired } from "../middleware/admin.js";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors.js";
import { getRequestLogger } from "../logging/logger.js";
import { imageUpload } from "../middleware/image-upload.js";
import { removeImage } from "../uploads.js";
import {
  getMinItemsToView,
  setMinItemsToView,
  UnlockSettings,
} from "../unlock-threshold.js";
import {
  addItem,
  deleteItem,
  findOwnWishlist,
  updateItem,
  type ItemOwner,
} from "../wishlist-items.js";
import { rotateInviteCode } from "./family.js";
import { listItemsWithReservations } from "./wishlist.js";

const WISH_COUNT = `(
  select count(*)
  from wishlist_items i
  join wishlists w on w.id = i.wishlist_id
  where w.user_id = u.id and w.family_id is not distinct from fm.family_id
)::int as wish_count`;

const PROFILE_COLUMNS = ["id", "name", "email", "username"];

/** Mirrors the users_username_format check of the username migration. */
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;
const NAME_MAX_LENGTH = 80;
const PASSWORD_MIN_LENGTH = 6;
const BCRYPT_ROUNDS = 10;

export type AdminMember = {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  family_id: string | null;
  wish_count: number;
};

type Family = { id: string; name: string };

type Identifiers = { email?: string | null; username?: string | null };

function blankToNull(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

const Name = z.string().trim().min(1).max(NAME_MAX_LENGTH);
const Email = z.preprocess(
  blankToNull,
  z.string().trim().toLowerCase().email().nullable(),
);
const Username = z.preprocess(
  blankToNull,
  z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_PATTERN, "3 à 32 caractères : lettres, chiffres, . _ -")
    .nullable(),
);
const Password = z.string().min(PASSWORD_MIN_LENGTH);

const IDENTIFIER_REQUIRED = {
  message: "email or username required",
  path: ["identifier"],
};

export const AccountCreate = z
  .object({
    name: Name,
    email: Email.optional(),
    username: Username.optional(),
    password: Password,
    familyId: z.string().uuid().nullable().optional(),
  })
  .refine((a) => a.email || a.username, IDENTIFIER_REQUIRED);

export const AccountUpdate = z.object({
  name: Name.optional(),
  email: Email.optional(),
  username: Username.optional(),
});

export const PasswordReset = z.object({ password: Password });

const FamilyRename = z.object({ name: z.string().trim().min(1).max(120) });

export const FamilyMove = z.object({
  familyId: z.preprocess(blankToNull, z.string().uuid().nullable()),
});

type MovePlan = {
  userId: string;
  from: string | null;
  to: string | null;
  source?: { id: string };
  target?: { id: string };
};

function reservationsMadeIn(dbConn: Knex, userId: string, familyId: string) {
  return dbConn("reservations")
    .where("reserver_user_id", userId)
    .whereIn(
      "item_id",
      dbConn("wishlist_items as i")
        .join("wishlists as w", "w.id", "i.wishlist_id")
        .where("w.family_id", familyId)
        .select("i.id"),
    );
}

function reservationsOn(dbConn: Knex, wishlistId: string) {
  return dbConn("reservations").whereIn(
    "item_id",
    dbConn("wishlist_items").where({ wishlist_id: wishlistId }).select("id"),
  );
}

async function countRows(query: Knex.QueryBuilder) {
  const row = await query.count({ count: "*" }).first();
  return Number(row?.count ?? 0);
}

/** The list follows its owner; reservations made across the old family, both
 *  ways, are what the move drops. */
export async function moveImpact(
  dbConn: Knex,
  { userId, from, source, target }: MovePlan,
) {
  return {
    wishes: source
      ? await countRows(dbConn("wishlist_items").where({ wishlist_id: source.id }))
      : 0,
    reservations_made: from
      ? await countRows(reservationsMadeIn(dbConn, userId, from))
      : 0,
    reservations_received: source
      ? await countRows(reservationsOn(dbConn, source.id))
      : 0,
    merges: Boolean(source && target),
  };
}

/** A list the user left behind in the target family takes the moving wishes,
 *  so the user ends up with a single list there. */
export function moveMember(
  dbConn: Knex,
  { userId, from, to, source, target }: MovePlan,
) {
  return dbConn.transaction(async (trx) => {
    if (from) await reservationsMadeIn(trx, userId, from).del();
    if (source) {
      await reservationsOn(trx, source.id).del();
      if (target) {
        await trx("wishlist_items")
          .where({ wishlist_id: source.id })
          .update({ wishlist_id: target.id });
        await trx("wishlists").where({ id: source.id }).del();
      } else {
        await trx("wishlists").where({ id: source.id }).update({ family_id: to });
      }
    }
    await trx("family_memberships").where({ user_id: userId }).del();
    if (to)
      await trx("family_memberships").insert({ user_id: userId, family_id: to });
  });
}

export function keepsAnIdentifier(current: Identifiers, changes: Identifiers) {
  const merged = { ...current, ...changes };
  return Boolean(merged.email || merged.username);
}

export async function findTakenIdentifier(
  dbConn: Knex,
  { email, username }: Identifiers,
  exceptUserId?: string,
): Promise<"email" | "username" | null> {
  const candidates = [
    ["email", email],
    ["username", username],
  ] as const;

  for (const [field, value] of candidates) {
    if (!value) continue;
    const query = dbConn("users").where({ [field]: value });
    if (exceptUserId) query.whereNot({ id: exceptUserId });
    if (await query.first()) return field;
  }
  return null;
}

async function refuseTakenIdentifier(
  dbConn: Knex,
  identifiers: Identifiers,
  exceptUserId?: string,
) {
  const taken = await findTakenIdentifier(dbConn, identifiers, exceptUserId);
  if (taken)
    throw new ConflictError(`${taken} already used`, { field: taken });
}

export function groupMembersByFamily(
  families: Family[],
  members: AdminMember[],
) {
  return {
    families: families.map((family) => ({
      ...family,
      members: members.filter((m) => m.family_id === family.id),
    })),
    familyless: members.filter((m) => !m.family_id),
  };
}

export function listMembers(dbConn: Knex): Promise<AdminMember[]> {
  return dbConn("users as u")
    .leftJoin("family_memberships as fm", "fm.user_id", "u.id")
    .select(
      "u.id",
      "u.name",
      "u.email",
      "u.username",
      "fm.family_id",
      dbConn.raw(WISH_COUNT),
    )
    .orderBy("u.name", "asc");
}

/** Everything the cascade removes, counted across every list the user owns,
 *  family-less and left-behind ones included. */
export async function deletionImpact(dbConn: Knex, userId: string) {
  const counts = await dbConn
    .select(
      dbConn.raw(
        `(select count(*) from wishlist_items i
           join wishlists w on w.id = i.wishlist_id
          where w.user_id = ?)::int as wishes`,
        [userId],
      ),
      dbConn.raw(
        `(select count(*) from reservations r
          where r.reserver_user_id = ?)::int as reservations_made`,
        [userId],
      ),
      dbConn.raw(
        `(select count(*) from reservations r
           join wishlist_items i on i.id = r.item_id
           join wishlists w on w.id = i.wishlist_id
          where w.user_id = ?)::int as reservations_received`,
        [userId],
      ),
    )
    .first();

  return counts as {
    wishes: number;
    reservations_made: number;
    reservations_received: number;
  };
}

export function createAdminRouter(dbConn: Knex = db, admins?: Set<string>) {
  const router = Router();

  router.use(authRequired, adminRequired(dbConn, admins));

  async function findProfile(id: string) {
    const user = await dbConn("users")
      .select(PROFILE_COLUMNS)
      .where({ id })
      .first();
    if (!user) throw new NotFoundError("user not found");
    return user;
  }

  router.get(
    "/settings",
    asyncHandler(async (_req, res) => {
      res.json({ minItemsToView: await getMinItemsToView(dbConn) });
    }),
  );

  router.put(
    "/settings",
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "update-settings",
      });
      const parse = UnlockSettings.safeParse(req.body);
      if (!parse.success) throw ValidationError.fromZod(parse.error);

      await setMinItemsToView(dbConn, parse.data.minItemsToView);

      log.info(
        { adminId: req.user!.id, minItemsToView: parse.data.minItemsToView },
        "Admin updated the settings",
      );
      res.json(parse.data);
    }),
  );

  router.get(
    "/families",
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "list-families",
      });
      const [families, members] = await Promise.all([
        dbConn("families").select("id", "name").orderBy("name", "asc"),
        listMembers(dbConn),
      ]);

      log.info(
        { adminId: req.user!.id, familyCount: families.length },
        "Admin listed families",
      );
      res.json(groupMembersByFamily(families, members));
    }),
  );

  router.post(
    "/users",
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "create-user",
      });
      const parse = AccountCreate.safeParse(req.body);
      if (!parse.success) throw ValidationError.fromZod(parse.error);
      const { name, email, username, password, familyId } = parse.data;

      await refuseTakenIdentifier(dbConn, { email, username });

      if (familyId) {
        const family = await dbConn("families").where({ id: familyId }).first();
        if (!family) throw new NotFoundError("family not found");
      }

      const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await dbConn.transaction(async (trx) => {
        const [created] = await trx("users")
          .insert({
            name,
            email: email ?? null,
            username: username ?? null,
            password_hash,
          })
          .returning(PROFILE_COLUMNS);

        if (familyId)
          await trx("family_memberships").insert({
            user_id: created.id,
            family_id: familyId,
          });
        return created;
      });

      log.info(
        { adminId: req.user!.id, targetId: user.id },
        "Admin created a user",
      );
      res.status(201).json(user);
    }),
  );

  async function ownerOf(userId: string): Promise<ItemOwner> {
    await findProfile(userId);
    const membership = await dbConn("family_memberships")
      .select("family_id")
      .where({ user_id: userId })
      .first();
    return { userId, familyId: membership?.family_id ?? null };
  }

  async function planMove(userId: string, input: unknown): Promise<MovePlan> {
    const parse = FamilyMove.safeParse(input);
    if (!parse.success) throw ValidationError.fromZod(parse.error);
    const to = parse.data.familyId;

    const owner = await ownerOf(userId);
    const from = owner.familyId ?? null;
    if (from === to) throw new BadRequestError("already in this family");
    if (to) {
      const family = await dbConn("families").where({ id: to }).first();
      if (!family) throw new NotFoundError("family not found");
    }

    const [source, target] = await Promise.all([
      findOwnWishlist(dbConn, owner),
      findOwnWishlist(dbConn, { userId, familyId: to }),
    ]);
    return { userId, from, to, source, target };
  }

  router.get(
    "/users/:id/move-impact",
    asyncHandler(async (req, res) => {
      const { id } = req.params as { id: string };
      res.json(await moveImpact(dbConn, await planMove(id, req.query)));
    }),
  );

  router.put(
    "/users/:id/family",
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "move-user",
      });
      const { id } = req.params as { id: string };
      if (id === req.user!.id)
        throw new ConflictError("cannot move your own account");

      const plan = await planMove(id, req.body);
      await moveMember(dbConn, plan);

      log.info(
        { adminId: req.user!.id, targetId: id, familyId: plan.to },
        "Admin moved a user to another family",
      );
      res.json({ ok: true });
    }),
  );

  router.patch(
    "/families/:id",
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "rename-family",
      });
      const { id } = req.params as { id: string };
      const parse = FamilyRename.safeParse(req.body);
      if (!parse.success) throw ValidationError.fromZod(parse.error);

      const [family] = await dbConn("families")
        .where({ id })
        .update({ name: parse.data.name })
        .returning(["id", "name"]);
      if (!family) throw new NotFoundError("family not found");

      log.info({ adminId: req.user!.id, familyId: id }, "Admin renamed a family");
      res.json(family);
    }),
  );

  router.post(
    "/families/:id/rotate-invite",
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "rotate-invite",
      });
      const { id } = req.params as { id: string };
      const family = await rotateInviteCode(dbConn, id);

      log.info(
        { adminId: req.user!.id, familyId: id },
        "Admin rotated an invite code",
      );
      res.json(family);
    }),
  );

  router.post(
    "/users/:id/items",
    imageUpload,
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "add-item",
      });
      const { id } = req.params as { id: string };
      const item = await addItem(dbConn, await ownerOf(id), req.body, req.file);

      log.info(
        { adminId: req.user!.id, targetId: id, itemId: item.id },
        "Admin added a wish",
      );
      res.status(201).json(item);
    }),
  );

  router.patch(
    "/users/:id/items/:itemId",
    imageUpload,
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "update-item",
      });
      const { id, itemId } = req.params as { id: string; itemId: string };
      const item = await updateItem(
        dbConn,
        await ownerOf(id),
        itemId,
        req.body,
        req.file,
      );

      log.info(
        { adminId: req.user!.id, targetId: id, itemId },
        "Admin edited a wish",
      );
      res.json(item);
    }),
  );

  router.delete(
    "/users/:id/items/:itemId",
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "delete-item",
      });
      const { id, itemId } = req.params as { id: string; itemId: string };
      await deleteItem(dbConn, await ownerOf(id), itemId);

      log.info(
        { adminId: req.user!.id, targetId: id, itemId },
        "Admin removed a wish",
      );
      res.json({ ok: true });
    }),
  );

  router.get(
    "/users/:id",
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "view-user",
      });
      const { id } = req.params as { id: string };
      const user = await findProfile(id);
      const owner = await ownerOf(id);

      const family = owner.familyId
        ? await dbConn("families")
            .select("id", "name")
            .where({ id: owner.familyId })
            .first()
        : null;

      const wishlist = await findOwnWishlist(dbConn, owner);

      const items = wishlist
        ? await listItemsWithReservations(dbConn, wishlist.id)
        : [];

      log.info({ adminId: req.user!.id, targetId: id }, "Admin viewed a user");
      res.json({ user, family: family ?? null, items });
    }),
  );

  router.patch(
    "/users/:id",
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "update-user",
      });
      const { id } = req.params as { id: string };
      const parse = AccountUpdate.safeParse(req.body);
      if (!parse.success) throw ValidationError.fromZod(parse.error);
      const changes = parse.data;

      const current = await findProfile(id);
      if (!keepsAnIdentifier(current, changes))
        throw new ValidationError("Données invalides", [
          { field: "identifier", reason: IDENTIFIER_REQUIRED.message },
        ]);

      await refuseTakenIdentifier(dbConn, changes, id);

      const [user] = await dbConn("users")
        .where({ id })
        .update(changes)
        .returning(PROFILE_COLUMNS);

      log.info({ adminId: req.user!.id, targetId: id }, "Admin edited a user");
      res.json(user);
    }),
  );

  router.put(
    "/users/:id/password",
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "reset-password",
      });
      const { id } = req.params as { id: string };
      const parse = PasswordReset.safeParse(req.body);
      if (!parse.success) throw ValidationError.fromZod(parse.error);

      await findProfile(id);
      const password_hash = await bcrypt.hash(
        parse.data.password,
        BCRYPT_ROUNDS,
      );
      await dbConn("users").where({ id }).update({ password_hash });

      log.info(
        { adminId: req.user!.id, targetId: id },
        "Admin set a new password",
      );
      res.json({ ok: true });
    }),
  );

  router.get(
    "/users/:id/deletion-impact",
    asyncHandler(async (req, res) => {
      const { id } = req.params as { id: string };
      await findProfile(id);
      res.json(await deletionImpact(dbConn, id));
    }),
  );

  router.delete(
    "/users/:id",
    asyncHandler(async (req, res) => {
      const log = getRequestLogger(req, {
        module: "admin",
        action: "delete-user",
      });
      const { id } = req.params as { id: string };
      if (id === req.user!.id)
        throw new ConflictError("cannot delete your own account");

      await findProfile(id);
      const images = await dbConn("wishlist_items as i")
        .join("wishlists as w", "w.id", "i.wishlist_id")
        .where("w.user_id", id)
        .whereNotNull("i.image_url")
        .pluck("i.image_url");

      await dbConn("users").where({ id }).del();
      await Promise.all(images.map(removeImage));

      log.info({ adminId: req.user!.id, targetId: id }, "Admin deleted a user");
      res.json({ ok: true });
    }),
  );

  return router;
}

export default createAdminRouter();
