// web/src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL ?? "/api";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function request<T = any>(
  path: string,
  opts: { method?: Method; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = JSON.parse(text);
      if (j?.error) msg = j.error;
    } catch {
      if (text) msg = text.slice(0, 200);
    }
    throw new Error(msg);
  }
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export type User = { id: string; name: string; email: string };
export type Family = { id: string; name: string; invite_code?: string | null };

export const api = {
  // --- Auth ---
  // Tolerant: accepts either { user } or the user object directly
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
    console.log(fam);
    return fam ?? null;
  },
  createFamily: (name: string) =>
    request<Family>("/families", { method: "POST", body: { name } }),
  joinFamily: (code: string) =>
    request<Family>("/families/join", { method: "POST", body: { code } }),

  // --- Wishlist (mine) ---
  ensureMyWishlist: () => request("/wishlists/me/ensure", { method: "POST" }),
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
    request(`/reservations/${itemId}`, { method: "POST" }),
  unreserve: (itemId: string) =>
    request(`/reservations/${itemId}`, { method: "DELETE" }),
  purchase: (itemId: string) =>
    request(`/reservations/${itemId}/purchase`, { method: "POST" }),
};

export default api;
