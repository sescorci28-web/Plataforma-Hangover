-- Migración para Mejoras Premium y Sociales de Eventos
-- Ejecutar en el Editor SQL de Supabase.

-- 1. Tabla de Galería Oficial del Evento (Administrada por el Organizador)
CREATE TABLE IF NOT EXISTS public.event_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    featured BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.event_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to event_gallery" ON public.event_gallery;
CREATE POLICY "Allow public read access to event_gallery" ON public.event_gallery
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow organizer manage own event_gallery" ON public.event_gallery;
CREATE POLICY "Allow organizer manage own event_gallery" ON public.event_gallery
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = event_gallery.event_id
              AND public.events.creator_id = auth.uid()
        )
    );

-- 2. Tabla de Lotes de Entradas (Ticket Batches / Tiers)
CREATE TABLE IF NOT EXISTS public.event_ticket_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    capacity INT NOT NULL,
    sold_count INT DEFAULT 0,
    active_from TIMESTAMP WITH TIME ZONE,
    active_to TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'sold_out', 'locked')) DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.event_ticket_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to event_ticket_batches" ON public.event_ticket_batches;
CREATE POLICY "Allow public read access to event_ticket_batches" ON public.event_ticket_batches
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow organizer manage own event_ticket_batches" ON public.event_ticket_batches;
CREATE POLICY "Allow organizer manage own event_ticket_batches" ON public.event_ticket_batches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = event_ticket_batches.event_id
              AND public.events.creator_id = auth.uid()
        )
    );

-- 3. Tabla de Favoritos de Evento (Event Favorites)
CREATE TABLE IF NOT EXISTS public.event_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, event_id)
);

ALTER TABLE public.event_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own event_favorites" ON public.event_favorites;
CREATE POLICY "Allow users to read own event_favorites" ON public.event_favorites
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to manage own event_favorites" ON public.event_favorites;
CREATE POLICY "Allow users to manage own event_favorites" ON public.event_favorites
    FOR ALL USING (auth.uid() = user_id);

-- 4. Tabla de Notificaciones de Evento
CREATE TABLE IF NOT EXISTS public.event_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT DEFAULT 'general',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to event_notifications" ON public.event_notifications;
CREATE POLICY "Allow public read access to event_notifications" ON public.event_notifications
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow organizer write access to own event_notifications" ON public.event_notifications;
CREATE POLICY "Allow organizer write access to own event_notifications" ON public.event_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = event_notifications.event_id
              AND public.events.creator_id = auth.uid()
        )
    );

-- 5. Tablas para Chat del Evento (Connect Integration)
CREATE TABLE IF NOT EXISTS public.event_chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID UNIQUE NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.event_chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view chat rooms" ON public.event_chat_rooms;
CREATE POLICY "Allow members to view chat rooms" ON public.event_chat_rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.event_id = event_chat_rooms.event_id
              AND bookings.user_id = auth.uid()
              AND bookings.status IN ('confirmed', 'completed')
        )
        OR EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = event_chat_rooms.event_id
              AND public.events.creator_id = auth.uid()
        )
    );

CREATE TABLE IF NOT EXISTS public.event_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.event_chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.event_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to read messages" ON public.event_chat_messages;
CREATE POLICY "Allow members to read messages" ON public.event_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.event_chat_rooms r
            JOIN public.bookings b ON b.event_id = r.event_id
            WHERE r.id = event_chat_messages.room_id
              AND b.user_id = auth.uid()
              AND b.status IN ('confirmed', 'completed')
        )
        OR EXISTS (
            SELECT 1 FROM public.event_chat_rooms r
            JOIN public.events e ON e.id = r.event_id
            WHERE r.id = event_chat_messages.room_id
              AND e.creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow members to send messages" ON public.event_chat_messages;
CREATE POLICY "Allow members to send messages" ON public.event_chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND (
            EXISTS (
                SELECT 1 FROM public.event_chat_rooms r
                JOIN public.bookings b ON b.event_id = r.event_id
                WHERE r.id = event_chat_messages.room_id
                  AND b.user_id = auth.uid()
                  AND b.status IN ('confirmed', 'completed')
            )
            OR EXISTS (
                SELECT 1 FROM public.event_chat_rooms r
                JOIN public.events e ON e.id = r.event_id
                WHERE r.id = event_chat_messages.room_id
                  AND e.creator_id = auth.uid()
            )
        )
    );

-- 6. Configurar buckets públicos adicionales de almacenamiento si no existen
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('event-gallery', 'event-gallery', true),
  ('event-memories', 'event-memories', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para el bucket event-gallery
DROP POLICY IF EXISTS "Public Read Access for event-gallery" ON storage.objects;
CREATE POLICY "Public Read Access for event-gallery" ON storage.objects
    FOR SELECT USING (bucket_id = 'event-gallery');

DROP POLICY IF EXISTS "Authenticated Upload Access for event-gallery" ON storage.objects;
CREATE POLICY "Authenticated Upload Access for event-gallery" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'event-gallery' AND auth.role() = 'authenticated');

-- 7. Tabla de Novedades / Timeline (event_updates)
CREATE TABLE IF NOT EXISTS public.event_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.event_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to event_updates" ON public.event_updates;
CREATE POLICY "Allow public read access to event_updates" ON public.event_updates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow organizer manage own event_updates" ON public.event_updates;
CREATE POLICY "Allow organizer manage own event_updates" ON public.event_updates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = event_updates.event_id
              AND public.events.creator_id = auth.uid()
        )
    );

-- 8. Tabla de Lineup de Artistas (event_lineup)
CREATE TABLE IF NOT EXISTS public.event_lineup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    artist_name TEXT NOT NULL,
    performance_time TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.event_lineup ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to event_lineup" ON public.event_lineup;
CREATE POLICY "Allow public read access to event_lineup" ON public.event_lineup
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow organizer manage own event_lineup" ON public.event_lineup;
CREATE POLICY "Allow organizer manage own event_lineup" ON public.event_lineup
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = event_lineup.event_id
              AND public.events.creator_id = auth.uid()
        )
    );

-- 9. Tabla de Asistentes / Pre-Registro (event_attendees)
CREATE TABLE IF NOT EXISTS public.event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('going', 'interested')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to event_attendees" ON public.event_attendees;
CREATE POLICY "Allow public read access to event_attendees" ON public.event_attendees
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users manage own event_attendees" ON public.event_attendees;
CREATE POLICY "Allow users manage own event_attendees" ON public.event_attendees
    FOR ALL USING (auth.uid() = user_id);

-- 10. Tabla de Álbum de Recuerdos / Memories (event_memories)
CREATE TABLE IF NOT EXISTS public.event_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    title TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.event_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to event_memories" ON public.event_memories;
CREATE POLICY "Allow public read access to event_memories" ON public.event_memories
    FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Allow users to upload own event_memories" ON public.event_memories;
CREATE POLICY "Allow users to upload own event_memories" ON public.event_memories
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        -- Validar que asistió y usó su ticket (status = completed, qr_status = used)
        AND EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.event_id = event_memories.event_id
              AND bookings.user_id = auth.uid()
              AND bookings.status = 'completed'
              AND bookings.qr_status = 'used'
        )
    );

DROP POLICY IF EXISTS "Allow users to delete own event_memories" ON public.event_memories;
CREATE POLICY "Allow users to delete own event_memories" ON public.event_memories
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas de Storage para el bucket event-memories
DROP POLICY IF EXISTS "Public Read Access for event-memories" ON storage.objects;
CREATE POLICY "Public Read Access for event-memories" ON storage.objects
    FOR SELECT USING (bucket_id = 'event-memories');

DROP POLICY IF EXISTS "Authenticated Upload Access for event-memories" ON storage.objects;
CREATE POLICY "Authenticated Upload Access for event-memories" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'event-memories' 
        AND auth.role() = 'authenticated'
    );
