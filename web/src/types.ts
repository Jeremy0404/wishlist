export interface Family {
  id: string;
  name: string;
  invite_code: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  joined_at: string;
}

export type ReservationStatus = "reserved" | "purchased";

export interface Wishlist {
  id: string;
  public_slug?: string | null;
  published_at?: string | null;
  created_at?: string | null;
}

export interface WishlistItemForm {
  title: string;
  url?: string;
  price_eur?: number;
  notes?: string;
  priority?: number;
}

export interface WishlistItem {
  id: string;
  title: string;
  url?: string | null;
  price_eur?: number | null;
  notes?: string | null;
  priority?: number | null;
  original_title?: string | null;
  reserved?: boolean;
  reserver_name?: string | null;
  reservation_status?: ReservationStatus | null;
  created_at?: string | null;
}
