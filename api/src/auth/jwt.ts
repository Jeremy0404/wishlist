import jwt from 'jsonwebtoken';
import type { JwtUser } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const COOKIE_NAME = 'auth';

export function signUser(user: JwtUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): JwtUser | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtUser;
    } catch {
        return null;
    }
}

export const authCookie = {
    name: COOKIE_NAME,
    options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: false, // set true behind HTTPS in prod
        path: '/',
        maxAge: 60 * 60 * 24 * 30
    }
};
