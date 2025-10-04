const API_URL = import.meta.env.VITE_API_URL as string;

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function request<T>(
  path: string,
  opts: { method?: Method; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; name: string }) =>
    request<{ id: string; email: string }>("/auth/register", {
      method: "POST",
      body: data,
    }),
  login: (data: { email: string; password: string }) =>
    request<{ id: string; email: string }>("/auth/login", {
      method: "POST",
      body: data,
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  // Families
  createFamily: (name: string) =>
    request<{ id: string; name: string; invite_code: string }>("/families", {
      method: "POST",
      body: { name },
    }),
  joinFamily: (invite_code: string) =>
    request<{ family_id: string; name: string }>("/families/join", {
      method: "POST",
      body: { invite_code },
    }),
  myFamilies: () =>
    request<
      Array<{ id: string; name: string; invite_code: string; role: string }>
    >("/families/me"),

  // Wishlists (me)
  ensureMyWishlist: () => request("/wishlists/me", { method: "POST" }),
  getMyWishlist: () =>
    request<{ wishlist: any; items: any[] }>("/wishlists/me"),
  addMyItem: (body: {
    title: string;
    url?: string;
    price_eur?: number;
    notes?: string;
    priority?: number;
  }) => request("/wishlists/me/items", { method: "POST", body }),
  updateMyItem: (
    id: string,
    body: Partial<{
      title: string;
      url?: string;
      price_cents?: number;
      notes?: string;
      priority?: number;
    }>,
  ) => request(`/wishlists/me/items/${id}`, { method: "PATCH", body }),
  deleteMyItem: (id: string) =>
    request(`/wishlists/me/items/${id}`, { method: "DELETE" }),

  // Browse (gated)
  others: () =>
    request<
      Array<{
        wishlist_id: string;
        user_id: string;
        name: string;
        created_at: string;
      }>
    >("/wishlists"),
  viewWishlist: (userId: string) =>
    request<{
      wishlist: any;
      owner: { id: string; name: string } | null;
      items: Array<any>;
    }>(`/wishlists/${userId}`),

  // Gifting
  reserve: (itemId: string) =>
    request(`/wishlists/items/${itemId}/reserve`, { method: "POST" }),
  unreserve: (itemId: string) =>
    request(`/wishlists/items/${itemId}/unreserve`, { method: "POST" }),
  purchase: (itemId: string) =>
    request(`/wishlists/items/${itemId}/purchase`, { method: "POST" }),

  me: () => request<{ id: string; email: string; name: string }>("/auth/me"),
};
