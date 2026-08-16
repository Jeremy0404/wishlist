// web/src/services/api.ts
import type {
  Family,
  FamilyMember,
  FamilyWishlist,
  LinkPreview,
  Wishlist,
  WishlistItem,
  WishlistItemForm,
} from "../types.ts";

export const API_URL = import.meta.env.VITE_API_URL ?? "/api";

type Method = "GET" | "POST" | "PATCH" | "DELETE";
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
    const data = await res.json();
    const msg = (data && (data.error || data.message)) || (await res.text());

    throw new Error(msg || res.statusText);
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

export type User = { id: string; name: string; email: string };

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
  login: (email: string, password: string) =>
    request<User | { user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  register: (name: string, email: string, password: string) =>
    request<User | { user: User }>("/auth/register", {
      method: "POST",
      body: { name, email, password },
    }),
  logout: () => request("/auth/logout", { method: "POST" }),
  requestMagicLink: (email: string) =>
    request<{ ok: true }>("/auth/magic-link", {
      method: "POST",
      body: { email },
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
  rotateInviteCode: () =>
    request<Family>("/families/rotate-invite", { method: "POST" }),
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

  publishMyWishlist: () =>
    request<{ wishlist: Wishlist }>("/wishlists/me/publish", {
      method: "POST",
    }),
  unpublishMyWishlist: () =>
    request<{ wishlist: Wishlist }>("/wishlists/me/publish", {
      method: "DELETE",
    }),
  viewPublicWishlist: (slug: string) =>
    request<{
      owner?: { name?: string };
      wishlist?: Wishlist;
      items: WishlistItem[];
    }>(`/wishlists/public/${slug}`),

  // --- Others / viewing ---
  others: () => request<FamilyWishlist[]>("/wishlists"),
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
};

export function onUnauthorized(handler: UnauthorizedHandler) {
  unauthorizedHandlers.push(handler);
}

export default api;
