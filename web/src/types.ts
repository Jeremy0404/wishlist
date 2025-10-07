export interface Family {
  id: string;
  name: string;
  invite_code: string | null;
}

export interface Item {
  id: string;
  title: string;
  priority: number;
  url: string;
  price_eur: number;
  notes: string;
  reserved: boolean;
  reserver_name: string;
  reservation_status: ReservationStatus;
}

type ReservationStatus = "reserved" | "purchased";
