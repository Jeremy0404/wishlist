import { Request, Response, NextFunction } from 'express';
import { verifyToken, authCookie } from '../auth/jwt.js';
import { db } from '../db/knex.js';

export function authRequired(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.[authCookie.name];
    const user = token ? verifyToken(token) : null;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    req.user = user;
    next();
}

export async function familyContext(req: Request, res: Response, next: NextFunction) {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    // For MVP we assume exactly 1 family; pick the first membership
    const memb = await db('family_memberships').where({ user_id: req.user.id }).first();
    if (!memb) return res.status(403).json({ error: 'not in a family' });
    req.familyId = memb.family_id;
    next();
}

/** Gate: you must have a wishlist with ≥1 item to browse others */
export async function mustHaveWishlistWithItem(req: Request, res: Response, next: NextFunction) {
    if (!req.user || !req.familyId) return res.status(401).json({ error: 'unauthorized' });
    const row = await db('wishlists as w')
        .leftJoin('wishlist_items as i', 'i.wishlist_id', 'w.id')
        .count<{ count: string }>('i.id as count')
        .where({ 'w.user_id': req.user.id, 'w.family_id': req.familyId })
        .first();
    const count = Number(row?.count ?? 0);
    if (count < 1) return res.status(403).json({ error: 'add at least one item to your wishlist' });
    next();
}
