// web/src/services/api.ts
import type { Family } from "../types.ts";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

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

  // --- Family ---
  getMyFamily: async () => {
    const fam = await request<Family | null>("/families/me");

    return fam ?? null;
  },
  createFamily: (name: string) =>
    request<Family>("/families", { method: "POST", body: { name } }),
  joinFamily: (code: string) =>
    request<Family>("/families/join", { method: "POST", body: { code } }),

  // --- Wishlist (mine) ---
  getMyWishlist: () => request<any>("/wishlists/me"),
  addMyItem: (body: {
    title: string;
    url?: string;
    price_eur?: number;
    notes?: string;
    priority?: number;
  }) => request<any>("/wishlists/me/items", { method: "POST", body }),
  deleteMyItem: (id: string) =>
    request(`/wishlists/me/items/${id}`, { method: "DELETE" }),

  // --- Others / viewing ---
  others: () => request<any[]>("/wishlists"),
  viewWishlist: (userId: string) => request<any>(`/wishlists/${userId}`),
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
