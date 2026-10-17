export interface ClubDetail {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string | null;
  location: string;
  description: string | null;
  banner_image: string | null;
  hero_image: string | null;
  logo: string | null;
  video_hero: string | null;
  imageUrl: string;
  gallery: string[];
  instagram: string | null;
  whatsapp: string | null;
  facebook: string | null;
  tiktok: string | null;
  website: string | null;
  opening_hours: string | null;
  isOpen: boolean;
  rating: number;
  reviews_count: number;
  hasRealRating: boolean;
  cover_price: number;
  price_range: string | null;
  payment_methods: string[];
  amenities: string[];
  capacity: number;
  club_type: string;
  status: string;
  active: boolean;
  provider_id: string | null;
  owner_id: string | null;
  business_id: string | null;
  enabled_modules: string[];
  modules_config: any;
}

export interface ClubMenuItem {
  id: string;
  club_id: string;
  category: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  active: boolean;
  featured: boolean;
  available: boolean;
}

export interface ClubServiceItem {
  id: string;
  club_id: string;
  name: string;
  description: string;
  price: number | null;
  active: boolean;
}

export interface ClubTable {
  id: string;
  club_id: string;
  table_number: string;
  name: string | null;
  zone: string | null;
  status: 'Libre' | 'Reservada' | 'Ocupada' | string;
  capacity: number | null;
  min_spend: number | null;
  conditions: string | null;
  active: boolean;
}

export interface ClubConnectAttendee {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  status: string | null;
  checkInAt: string;
}

export interface ClubConnectStats {
  activeConnectCount: number;
  visibleConnectCount: number;
  occupancyStatus: 'Baja ocupación' | 'Ocupación media' | 'Alta ocupación';
  occupancyColor: string;
  attendees: ClubConnectAttendee[];
}

export interface ClubBookingItem {
  id: string;
  user_id: string;
  club_id: string;
  provider_id: string | null;
  booking_type: 'club_vip' | 'club_cover' | string;
  reservation_date: string;
  number_of_people: number;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected' | string;
  total_amount: number;
  qr_code: string;
  qr_status: string;
  created_at: string;
}
