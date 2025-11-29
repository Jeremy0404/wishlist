import type { CookieOptions } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { JwtUser } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const COOKIE_NAME = 'auth';

export function signUser(user: JwtUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): JwtUser | null {
    try {
        const payload = jwt.verify(token, JWT_SECRET);

        if (isJwtUser(payload)) return payload;

        return null;
    } catch {
        return null;
    }
}

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

const authCookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: THIRTY_DAYS_MS
};

export const authCookie = {
    name: COOKIE_NAME,
    options: authCookieOptions
};

function isJwtUser(payload: JwtPayload | string): payload is JwtUser {
    return (
        typeof payload === 'object' &&
        payload !== null &&
        typeof payload.id === 'string' &&
        typeof payload.email === 'string'
    );
}
