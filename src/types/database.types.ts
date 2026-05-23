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
  created_at: string;
  updated_at: string;
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
    };
  };
}
