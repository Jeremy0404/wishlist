import { ApiError } from "../../services/api";

export type IdentifierField = "email" | "username";

export const TAKEN_MESSAGE_KEY: Record<IdentifierField, string> = {
  email: "admin.takenEmail",
  username: "admin.takenUsername",
};

export function takenField(error: unknown): IdentifierField | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const field = error.details?.field;
  return field === "email" || field === "username" ? field : null;
}
