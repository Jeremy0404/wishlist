import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { db } from '../db/knex.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

const Create = z.object({ name: z.string().min(1) });
router.post('/', authRequired, async (req, res) => {
    const parse = Create.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());
    const { name } = parse.data;

    const invite_code = `FAM-${randomBytes(3).toString('hex').toUpperCase()}`;
    const [family] = await db('families').insert({ name, invite_code }).returning(['id', 'name', 'invite_code']);
    await db('family_memberships').insert({ user_id: req.user!.id, family_id: family.id, role: 'admin' });

    res.json(family);
});

const Join = z.object({ invite_code: z.string().min(3) });
router.post('/join', authRequired, async (req, res) => {
    const parse = Join.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());
    const { invite_code } = parse.data;

    const fam = await db('families').where({ invite_code }).first();
    if (!fam) return res.status(404).json({ error: 'invalid invite_code' });

    // idempotent insert
    const exists = await db('family_memberships').where({ user_id: req.user!.id, family_id: fam.id }).first();
    if (!exists) {
        await db('family_memberships').insert({ user_id: req.user!.id, family_id: fam.id, role: 'member' });
    }
    res.json({ family_id: fam.id, name: fam.name });
});

router.get('/me', authRequired, async (req, res) => {
    const rows = await db('family_memberships as m')
        .join('families as f', 'f.id', 'm.family_id')
        .select('f.id', 'f.name', 'f.invite_code', 'm.role')
        .where('m.user_id', req.user!.id);
    res.json(rows);
});

export default router;
