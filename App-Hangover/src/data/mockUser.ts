export interface Ticket {
  id: string;
  eventName: string;
  date: string;
  qrCode: string; // Simulated QR string
  status: 'active' | 'used';
}

export interface Reservation {
  id: string;
  clubName: string;
  date: string;
  tableType: string;
  status: 'confirmed' | 'completed' | 'cancelled';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  tier: string;
  stats: {
    eventsAttended: number;
    points: number;
  };
  activeTickets: Ticket[];
  activeReservations: Reservation[];
}

export const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Andrés Felipe',
  email: 'andres@hangover.com',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
  tier: 'Miembro VIP',
  stats: {
    eventsAttended: 12,
    points: 450,
  },
  activeTickets: [
    {
      id: 't1',
      eventName: 'Neon Nights VIP',
      date: '28 OCT 2023',
      qrCode: 'HNGVR-NEON-8472',
      status: 'active',
    }
  ],
  activeReservations: [
    {
      id: 'r1',
      clubName: 'La Fábrica',
      date: '28 OCT 2023',
      tableType: 'Mesa VIP Diamante',
      status: 'confirmed',
    }
  ]
};
