import type { WishlistItem } from "../types.ts";

/** Illustration on a marketing surface: invented items, no data source, nothing
 *  real exposed. */
export const SAMPLE_OWNER = "Alexa";

export const SAMPLE_ITEMS: WishlistItem[] = [
  {
    id: "sample-1",
    title: "Appareil photo instantané Instax",
    url: null,
    price_eur: 89,
    notes: "En bleu ciel si possible.",
    priority: 2,
    image_url: null,
    reserved: false,
  },
  {
    id: "sample-2",
    title: "Un week-end de randonnée",
    url: null,
    price_eur: 140,
    notes: "Deux nuits en refuge, quelque part dans le Vercors.",
    priority: 3,
    image_url: null,
    reserved: true,
    reserver_name: "Camille",
    reservation_status: "reserved",
  },
];
