export interface ChatRoom {
  id: string;
  name: string;
  eventId: string;
  imageUrl: string;
  activeUsers: number;
  lastMessage: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  isMe: boolean;
}

export const MOCK_CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'room1',
    name: 'Neon Nights VIP (En vivo)',
    eventId: 'e1',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
    activeUsers: 142,
    lastMessage: 'Alguien sabe a qué hora sale Tiesto?',
    timestamp: 'Ahora',
  },
  {
    id: 'room2',
    name: 'Halloween Madness',
    eventId: 'e2',
    imageUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=400&q=80',
    activeUsers: 85,
    lastMessage: 'Nos vemos en la barra principal!',
    timestamp: 'Hace 5m',
  },
  {
    id: 'room3',
    name: 'Perreo Intenso (Previa)',
    eventId: 'e3',
    imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80',
    activeUsers: 34,
    lastMessage: 'Quién para compartir mesa?',
    timestamp: 'Hace 1h',
  }
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'room1': [
    {
      id: 'm1',
      userId: 'u2',
      userName: 'Carlos M.',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
      content: 'El ambiente está brutal 🔥 ya estamos en la zona VIP',
      timestamp: '10:45 PM',
      isMe: false,
    },
    {
      id: 'm2',
      userId: 'u3',
      userName: 'Laura G.',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
      content: 'Uy guarden puesto que voy llegando!',
      timestamp: '10:46 PM',
      isMe: false,
    },
    {
      id: 'm3',
      userId: 'u1',
      userName: 'Andrés Felipe',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
      content: 'Alguien sabe a qué hora sale Tiesto?',
      timestamp: '10:47 PM',
      isMe: true,
    }
  ]
};
