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

export interface WishlistItemForm {
  title: string;
  url?: string | null;
  price_eur?: number | null;
  notes?: string | null;
  priority?: number | null;
}

export interface WishlistItem extends WishlistItemForm {
  id: string;
  original_title?: string | null;
  reserved?: boolean;
  reserver_name?: string | null;
  reservation_status?: ReservationStatus | null;
  created_at?: string | null;
}
