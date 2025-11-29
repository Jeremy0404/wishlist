import jwt from 'jsonwebtoken';
import type { JwtUser } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const COOKIE_NAME = 'auth';

export function signUser(user: JwtUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): JwtUser | null {
    try {
        return jwt.verify<JwtUser>(token, JWT_SECRET);
    } catch {
        return null;
    }
}

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export const authCookie = {
    name: COOKIE_NAME,
    options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: THIRTY_DAYS_MS
    }
};
