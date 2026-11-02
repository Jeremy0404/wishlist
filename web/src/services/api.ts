// web/src/services/api.ts
import type {
  AdminAccountForm,
  AdminOverview,
  AdminProfile,
  AdminUserDetail,
  DeletionImpact,
  Family,
  FamilyMember,
  FamilyWishlists,
  LinkPreview,
  MoveImpact,
  UnlockSettings,
  Wishlist,
  WishlistItem,
  WishlistItemForm,
} from "../types.ts";

export const API_URL = import.meta.env.VITE_API_URL ?? "/api";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  readonly status: number;
  readonly details?: { field?: string };
  readonly code?: string;

  constructor(
    message: string,
    status: number,
    details?: { field?: string },
    code?: string,
  ) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

type ErrorBody = {
  code?: string;
  error?: string;
  message?: string;
  details?: { field?: string };
};

/** A proxy in front of the API can answer with an HTML page instead of JSON. */
async function readErrorBody(res: Response): Promise<ErrorBody | null> {
  const text = await res.text();
  try {
    const data: unknown = JSON.parse(text);
    return data && typeof data === "object" ? (data as ErrorBody) : null;
  } catch {
    return null;
  }
}
type UnauthorizedHandler = () => void;
const unauthorizedHandlers: UnauthorizedHandler[] = [];

type RequestOpts = {
  method?: Method;
  body?: unknown;
  headers?: Record<string, string>;
};

function buildOptions({
  method = "GET",
  body,
  headers = {},
}: RequestOpts): RequestInit {
  if (body instanceof FormData)
    return { method, credentials: "include", headers, body };

  const h =
    body === undefined
      ? headers
      : { "Content-Type": "application/json", ...headers };
  return {
    method,
    credentials: "include",
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

/** The API accepts the same item fields as JSON or as multipart; only the
 *  second can carry an uploaded photo. */
function itemPayload(body: WishlistItemForm, image?: File | null) {
  if (!image) return body;

  const form = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) form.append(key, String(value));
  }
  form.append("image", image);
  return form;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    for (const fn of unauthorizedHandlers) {
      fn();
    }
  }
  if (!res.ok) {
    const data = await readErrorBody(res);
    throw new ApiError(
      data?.error || data?.message || res.statusText,
      res.status,
      data?.details,
      data?.code,
    );
  }
  return await res.json();
}

export async function request<T>(
  path: string,
  opts: RequestOpts = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, buildOptions(opts));
  return handleResponse<T>(res);
}

export type User = {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  isAdmin: boolean;
};

/** `created` tells a brand-new account from one that just signed back in. */
export type MagicLinkSession = User & { created: boolean };

export const api = {
  // --- Auth ---
  async me(): Promise<User | null> {
    const data = await request<any>("/auth/me");
    if (data && typeof data === "object" && "user" in data)
      return (data.user as User) ?? null;
    return (data as User) ?? null;
  },
  login: (identifier: string, password: string) =>
    request<User | { user: User }>("/auth/login", {
      method: "POST",
      body: { identifier, password },
    }),
  register: (name: string, email: string, password: string) =>
    request<User | { user: User }>("/auth/register", {
      method: "POST",
      body: { name, email, password },
    }),
  logout: () => request("/auth/logout", { method: "POST" }),
  requestMagicLink: (email: string, redirect: string) =>
    request<{ ok: true }>("/auth/magic-link", {
      method: "POST",
      body: { email, redirect },
    }),
  consumeMagicLink: (token: string) =>
    request<MagicLinkSession>("/auth/magic-link/consume", {
      method: "POST",
      body: { token },
    }),
  updateMyName: (name: string) =>
    request<User>("/auth/me", { method: "PATCH", body: { name } }),

  // --- Family ---
  getMyFamily: async () => {
    const fam = await request<Family | null>("/families/me");

    return fam ?? null;
  },
  getFamilyMembers: () => request<FamilyMember[]>("/families/members"),
  createFamily: (name: string) =>
    request<Family>("/families", { method: "POST", body: { name } }),
  joinFamily: (code: string) =>
    request<Family>("/families/join", { method: "POST", body: { code } }),

  // --- Wishlist (mine) ---
  getMyWishlist: () =>
    request<{ wishlist: Wishlist | null; items: WishlistItem[] }>(
      "/wishlists/me",
    ),
  previewItemUrl: (url: string) =>
    request<LinkPreview>("/wishlists/me/items/preview", {
      method: "POST",
      body: { url },
    }),
  addMyItem: (body: WishlistItemForm, image?: File | null) =>
    request<WishlistItem>("/wishlists/me/items", {
      method: "POST",
      body: itemPayload(body, image),
    }),
  updateMyItem: (id: string, body: WishlistItemForm, image?: File | null) =>
    request<WishlistItem>(`/wishlists/me/items/${id}`, {
      method: "PATCH",
      body: itemPayload(body, image),
    }),
  deleteMyItem: (id: string) =>
    request(`/wishlists/me/items/${id}`, { method: "DELETE" }),

  // --- Others / viewing ---
  others: () => request<FamilyWishlists>("/wishlists"),
  viewWishlist: (userId: string) =>
    request<{ owner?: { name?: string }; items: WishlistItem[] }>(
      `/wishlists/${userId}`,
    ),
  reserve: (itemId: string) =>
    request(`/wishlists/items/${itemId}/reserve`, { method: "POST" }),
  unreserve: (itemId: string) =>
    request(`/wishlists/items/${itemId}/unreserve`, { method: "POST" }),
  purchase: (itemId: string) =>
    request(`/wishlists/items/${itemId}/purchase`, { method: "POST" }),

  // --- Admin ---
  adminOverview: () => request<AdminOverview>("/admin/families"),
  adminSettings: () => request<UnlockSettings>("/admin/settings"),
  adminSaveSettings: (body: UnlockSettings) =>
    request<UnlockSettings>("/admin/settings", { method: "PUT", body }),
  adminUser: (userId: string) =>
    request<AdminUserDetail>(`/admin/users/${userId}`),
  adminCreateUser: (body: AdminAccountForm) =>
    request<AdminProfile>("/admin/users", { method: "POST", body }),
  adminUpdateUser: (userId: string, body: AdminAccountForm) =>
    request<AdminProfile>(`/admin/users/${userId}`, { method: "PATCH", body }),
  adminSetPassword: (userId: string, password: string) =>
    request(`/admin/users/${userId}/password`, {
      method: "PUT",
      body: { password },
    }),
  adminDeletionImpact: (userId: string) =>
    request<DeletionImpact>(`/admin/users/${userId}/deletion-impact`),
  adminDeleteUser: (userId: string) =>
    request(`/admin/users/${userId}`, { method: "DELETE" }),
  adminMoveImpact: (userId: string, familyId: string | null) =>
    request<MoveImpact>(
      `/admin/users/${userId}/move-impact?${new URLSearchParams({ familyId: familyId ?? "" })}`,
    ),
  adminMoveUser: (userId: string, familyId: string | null) =>
    request(`/admin/users/${userId}/family`, {
      method: "PUT",
      body: { familyId },
    }),
  adminAddItem: (userId: string, body: WishlistItemForm, image?: File | null) =>
    request<WishlistItem>(`/admin/users/${userId}/items`, {
      method: "POST",
      body: itemPayload(body, image),
    }),
  adminUpdateItem: (
    userId: string,
    itemId: string,
    body: WishlistItemForm,
    image?: File | null,
  ) =>
    request<WishlistItem>(`/admin/users/${userId}/items/${itemId}`, {
      method: "PATCH",
      body: itemPayload(body, image),
    }),
  adminDeleteItem: (userId: string, itemId: string) =>
    request(`/admin/users/${userId}/items/${itemId}`, { method: "DELETE" }),
  adminRenameFamily: (familyId: string, name: string) =>
    request<{ id: string; name: string }>(`/admin/families/${familyId}`, {
      method: "PATCH",
      body: { name },
    }),
  adminRotateInvite: (familyId: string) =>
    request<Family>(`/admin/families/${familyId}/rotate-invite`, {
      method: "POST",
    }),
};

export function onUnauthorized(handler: UnauthorizedHandler) {
  unauthorizedHandlers.push(handler);
}

export default api;
