export type UserRole = 'user' | 'provider' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  username: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  slug: string | null;
  gallery_urls: string[] | null;
  duration: string | null;
  includes: string[] | null;
  excludes: string[] | null;
  requirements: string[] | null;
  response_time: string | null;
  verified: boolean | null;
  badge_status: 'top_provider' | 'most_booked' | 'featured' | null;
  availability_status: 'available' | 'busy' | 'offline' | null;
  next_available_date: string | null;
  
  // Relational taxonomy fields
  category_id?: string | null;
  subcategory_id?: string | null;
  subcategory?: string | null;
  
  // Profile and Location info
  base_city?: string | null;
  cover_url?: string | null;
  video_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  provider_status?: 'active' | 'vacation' | 'busy' | 'inactive' | null;
  
  // Performance and detailed features
  experience?: string | null;
  cities_coverage?: string[] | null;
  completed_bookings_count?: number | null;
  average_rating?: number | null;
  social_media?: Record<string, string> | null;
  whatsapp_number?: string | null;
  tags?: string[] | null;
  specialties?: string[] | null;
}

export interface Event {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string;
  image_url: string | null;
  ticket_price: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  provider_id: string | null;
  service_id: string | null;
  event_id: string | null;
  club_id: string | null;
  club_slug: string | null;
  reservation_date: string | null;
  event_date: string | null;
  event_time: string | null;
  number_of_people: number | null;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  notes: string | null;
  qr_code: string | null;
  qr_status: 'active' | 'used' | 'cancelled' | null;
  qr_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectPresence {
  id: string;
  user_id: string;
  club_id: string | null;
  event_id: string | null;
  booking_id: string | null;
  visibility: 'visible' | 'invisible';
  status: 'available' | 'observing' | 'do_not_disturb';
  check_in_at: string;
  last_seen_at: string;
  expires_at: string;
}

export interface ConnectRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  club_id: string | null;
  event_id: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface ConnectChat {
  id: string;
  user_a_id: string;
  user_b_id: string;
  club_id: string | null;
  event_id: string | null;
  created_at: string;
}

export interface ConnectMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
}

export interface ConnectBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface ConnectReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  club_id: string | null;
  event_id: string | null;
  created_at: string;
}

// Representación básica del esquema de base de datos
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Service, 'id' | 'provider_id' | 'created_at'>>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Event, 'id' | 'creator_id' | 'created_at'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Booking, 'id' | 'user_id' | 'created_at'>>;
      };
      connect_presence: {
        Row: ConnectPresence;
        Insert: Omit<ConnectPresence, 'id' | 'check_in_at' | 'last_seen_at'> & {
          id?: string;
          check_in_at?: string;
          last_seen_at?: string;
        };
        Update: Partial<Omit<ConnectPresence, 'id' | 'user_id' | 'check_in_at'>>;
      };
      connect_requests: {
        Row: ConnectRequest;
        Insert: Omit<ConnectRequest, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ConnectRequest, 'id' | 'sender_id' | 'created_at'>>;
      };
      connect_chats: {
        Row: ConnectChat;
        Insert: Omit<ConnectChat, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ConnectChat, 'id' | 'created_at'>>;
      };
      connect_messages: {
        Row: ConnectMessage;
        Insert: Omit<ConnectMessage, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ConnectMessage, 'id' | 'sender_id' | 'created_at'>>;
      };
      connect_blocks: {
        Row: ConnectBlock;
        Insert: Omit<ConnectBlock, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ConnectBlock, 'id' | 'created_at'>>;
      };
      connect_reports: {
        Row: ConnectReport;
        Insert: Omit<ConnectReport, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ConnectReport, 'id' | 'created_at'>>;
      };
    };
  };
}
