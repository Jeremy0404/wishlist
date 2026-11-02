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
  created_at?: string | null;
}

export interface FamilyWishlists {
  wishlists: FamilyWishlist[];
  wishesRequired: number;
  wishesMissing: number;
}

export interface UnlockSettings {
  minItemsToView: number;
}

export interface FamilyWishlist {
  wishlist_id: string | null;
  user_id: string;
  name: string;
  created_at?: string | null;
  item_count: number;
  reserved_by_me_count: number;
}

/** An empty string clears a field; leaving it out keeps the current value. */
export interface WishlistItemForm {
  title: string;
  url?: string;
  price_eur?: number | "";
  notes?: string;
  priority?: number;
  image_url?: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  url?: string | null;
  price_eur?: number | null;
  notes?: string | null;
  priority?: number | null;
  image_url?: string | null;
  original_title?: string | null;
  reserved?: boolean;
  reserver_user_id?: string | null;
  reserver_name?: string | null;
  reservation_status?: ReservationStatus | null;
  created_at?: string | null;
}

export interface AdminMember {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  wish_count: number;
}

export interface AdminFamily {
  id: string;
  name: string;
  members: AdminMember[];
}

export interface AdminOverview {
  families: AdminFamily[];
  familyless: AdminMember[];
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
}

export interface AdminUserDetail {
  user: AdminProfile;
  family: { id: string; name: string } | null;
  items: WishlistItem[];
}

export interface AdminAccountForm {
  name: string;
  email?: string;
  username?: string;
  password?: string;
  familyId?: string | null;
}

export interface DeletionImpact {
  wishes: number;
  reservations_made: number;
  reservations_received: number;
}

export interface MoveImpact extends DeletionImpact {
  merges: boolean;
}

export interface LinkPreview {
  title: string | null;
  price_eur: number | null;
  image_url: string | null;
}
