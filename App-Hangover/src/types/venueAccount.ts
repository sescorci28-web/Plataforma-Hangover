export type VenueAccountStatus = 'open' | 'pending_payment' | 'paid' | 'closed';

export interface VenueAccountEntry {
  id: string;
  account_id: string;
  order_id?: string | null;
  entry_type: 'charge' | 'payment' | 'adjustment';
  amount: number;
  items_summary?: string | null;
  items_detail?: Array<{
    product_name: string;
    variant_name?: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
    notes?: string | null;
  }> | null;
  payment_method?: 'cash' | 'card_terminal' | 'transfer' | 'wompi' | string | null;
  operator_id?: string | null;
  notes?: string | null;
  reference_entry_id?: string | null;
  created_at: string;
}

export interface VenueAccount {
  id: string;
  user_id: string;
  club_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  presence_id?: string | null;
  booking_id?: string | null;
  status: VenueAccountStatus;
  total_charged: number;
  total_paid: number;
  balance: number;
  payment_reference?: string | null;
  payment_method?: string | null;
  opened_at: string;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  entries_count?: number;
  entries?: VenueAccountEntry[];
}
