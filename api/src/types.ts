export type JwtUser = { id: string };

declare global {
    namespace Express {
        interface Request {
            user?: JwtUser;
            familyId?: string | null;
        }
    }
}
