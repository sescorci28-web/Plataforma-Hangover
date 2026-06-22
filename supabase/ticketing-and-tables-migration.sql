-- Migración para el Sistema Avanzado de Boletería y Gestión de Mesas
-- Ejecutar en el Editor SQL de Supabase.

-- 1. Añadir campos configurables a la tabla public.events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticketing_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'tickets' CHECK (event_type IN ('free', 'tickets', 'tables', 'tickets_and_tables', 'private', 'guestlist'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_card_title TEXT DEFAULT 'Adquiere tus accesos';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_card_description TEXT DEFAULT 'Tickets 100% autorizados del organizador directos al cliente.';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_sales_progress BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_capacity BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_attendees TEXT DEFAULT 'all' CHECK (show_attendees IN ('all', 'count_only', 'hidden'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_ticket_batches BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_favorites BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_countdown BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_remaining_tickets BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_statistics BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_who_is_going BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_event_chat BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_event_community BOOLEAN DEFAULT true;

-- 2. Añadir campos configurables a la tabla public.event_ticket_batches
ALTER TABLE public.event_ticket_batches ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.event_ticket_batches ADD COLUMN IF NOT EXISTS color_code TEXT DEFAULT '#9333ea'; -- violet-600 por defecto
ALTER TABLE public.event_ticket_batches ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- 3. Crear la tabla para la Gestión de Mesas (event_tables)
CREATE TABLE IF NOT EXISTS public.event_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    capacity INT NOT NULL,
    description TEXT,
    image_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'sold_out')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en event_tables
ALTER TABLE public.event_tables ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para event_tables
DROP POLICY IF EXISTS "Allow public read access to event_tables" ON public.event_tables;
CREATE POLICY "Allow public read access to event_tables" ON public.event_tables
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow organizer manage own event_tables" ON public.event_tables;
CREATE POLICY "Allow organizer manage own event_tables" ON public.event_tables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = event_tables.event_id
              AND public.events.creator_id = auth.uid()
        )
    );
