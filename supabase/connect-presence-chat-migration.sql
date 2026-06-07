-- HANGOVER CONNECT - MIGRACIÓN SQL DE BASE DE DATOS
-- Ejecutar este script en el Editor SQL de Supabase

-- 1. EXTENSIÓN DE LA TABLA PROFILES
-- Agrega columnas para el perfil social mínimo
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_tiktok TEXT;

-- 2. TABLA DE PRESENCIA EN TIEMPO REAL
CREATE TABLE IF NOT EXISTS public.connect_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  visibility TEXT CHECK (visibility IN ('visible', 'invisible')) DEFAULT 'visible' NOT NULL,
  status TEXT CHECK (status IN ('available', 'observing', 'do_not_disturb')) DEFAULT 'available' NOT NULL,
  check_in_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT presence_venue_check CHECK (
    (club_id IS NOT NULL AND event_id IS NULL) OR 
    (club_id IS NULL AND event_id IS NOT NULL)
  ),
  UNIQUE (user_id, club_id),
  UNIQUE (user_id, event_id)
);

-- Índices para búsquedas eficientes por local y optimización de visibilidad
CREATE INDEX IF NOT EXISTS idx_connect_presence_user ON public.connect_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_connect_presence_club ON public.connect_presence(club_id) WHERE (visibility = 'visible');
CREATE INDEX IF NOT EXISTS idx_connect_presence_event ON public.connect_presence(event_id) WHERE (visibility = 'visible');

-- 3. TABLA DE BLOQUEOS (SEGURIDAD)
CREATE TABLE IF NOT EXISTS public.connect_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_connect_blocks_blocker ON public.connect_blocks(blocker_id);

-- 4. TABLA DE SOLICITUDES DE CONVERSACIÓN
CREATE TABLE IF NOT EXISTS public.connect_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT requests_venue_check CHECK (
    (club_id IS NOT NULL AND event_id IS NULL) OR 
    (club_id IS NULL AND event_id IS NOT NULL)
  ),
  UNIQUE (sender_id, receiver_id, club_id),
  UNIQUE (sender_id, receiver_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_connect_requests_receiver ON public.connect_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_connect_requests_sender ON public.connect_requests(sender_id);

-- 5. TABLA DE CHATS / CONVERSACIONES PRIVADAS (PERMANENTES TRAS ACEPTACIÓN)
CREATE TABLE IF NOT EXISTS public.connect_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_b_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_a_id, user_b_id)
);

-- 6. TABLA DE MENSAJES (TIEMPO REAL)
CREATE TABLE IF NOT EXISTS public.connect_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.connect_chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_connect_messages_chat ON public.connect_messages(chat_id, created_at DESC);

-- 7. TABLA DE REPORTES (MODERACIÓN)
CREATE TABLE IF NOT EXISTS public.connect_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.connect_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_reports ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS RLS DE BLOQUEOS (connect_blocks)
-- Un usuario puede ver y gestionar sus propios bloqueos
DROP POLICY IF EXISTS "Users can manage their own blocks" ON public.connect_blocks;
CREATE POLICY "Users can manage their own blocks" ON public.connect_blocks
FOR ALL TO authenticated
USING (auth.uid() = blocker_id)
WITH CHECK (auth.uid() = blocker_id);

-- 10. POLÍTICAS RLS DE PRESENCIA (connect_presence)
-- Lectura: Solo visibles si el usuario actual está en el mismo local, la fila es visible y no hay bloqueos mutuos
DROP POLICY IF EXISTS "Users can read presence in the same venue" ON public.connect_presence;
CREATE POLICY "Users can read presence in the same venue" ON public.connect_presence
FOR SELECT TO authenticated
USING (
  -- Permite ver tu propia presencia
  user_id = auth.uid()
  OR (
    -- Excluir usuarios invisibles
    visibility = 'visible'
    -- Comprobar si la sesión de presencia consultada no ha expirado
    AND expires_at > now()
    AND last_seen_at > now() - INTERVAL '15 minutes'
    -- Validar que el usuario que consulta tiene presencia activa en el mismo local
    AND (
      (club_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.connect_presence self
        WHERE self.user_id = auth.uid() 
          AND self.club_id = connect_presence.club_id
          AND self.expires_at > now()
          AND self.last_seen_at > now() - INTERVAL '15 minutes'
      ))
      OR
      (event_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.connect_presence self
        WHERE self.user_id = auth.uid() 
          AND self.event_id = connect_presence.event_id
          AND self.expires_at > now()
          AND self.last_seen_at > now() - INTERVAL '15 minutes'
      ))
    )
    -- Excluir si hay bloqueos entre los usuarios
    AND NOT EXISTS (
      SELECT 1 FROM public.connect_blocks b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = connect_presence.user_id)
         OR (b.blocker_id = connect_presence.user_id AND b.blocked_id = auth.uid())
    )
  )
);

-- Escritura/Edición/Borrado de presencia propia
DROP POLICY IF EXISTS "Users can manage their own presence" ON public.connect_presence;
CREATE POLICY "Users can manage their own presence" ON public.connect_presence
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 11. POLÍTICAS RLS DE SOLICITUDES (connect_requests)
-- Lectura: Solo el emisor o receptor pueden ver las solicitudes
DROP POLICY IF EXISTS "Users can view own connect requests" ON public.connect_requests;
CREATE POLICY "Users can view own connect requests" ON public.connect_requests
FOR SELECT TO authenticated
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  -- Excluir si hay bloqueo mutuo
  AND NOT EXISTS (
    SELECT 1 FROM public.connect_blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = CASE WHEN sender_id = auth.uid() THEN receiver_id ELSE sender_id END)
       OR (b.blocker_id = CASE WHEN sender_id = auth.uid() THEN receiver_id ELSE sender_id END AND b.blocked_id = auth.uid())
  )
);

-- Creación: Cualquier usuario puede enviar si está en el mismo local y no está bloqueado
DROP POLICY IF EXISTS "Users can insert connect requests" ON public.connect_requests;
CREATE POLICY "Users can insert connect requests" ON public.connect_requests
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  -- Verificar presencia en el mismo local
  AND (
    (club_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.connect_presence self
      JOIN public.connect_presence target ON target.club_id = self.club_id
      WHERE self.user_id = auth.uid() 
        AND target.user_id = receiver_id
        AND self.club_id = connect_requests.club_id
        AND self.expires_at > now()
        AND target.expires_at > now()
    ))
    OR
    (event_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.connect_presence self
      JOIN public.connect_presence target ON target.event_id = self.event_id
      WHERE self.user_id = auth.uid() 
        AND target.user_id = receiver_id
        AND self.event_id = connect_requests.event_id
        AND self.expires_at > now()
        AND target.expires_at > now()
    ))
  )
  -- No bloqueados
  AND NOT EXISTS (
    SELECT 1 FROM public.connect_blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = receiver_id)
       OR (b.blocker_id = receiver_id AND b.blocked_id = auth.uid())
  )
);

-- Actualización: Solo el receptor puede aceptar/rechazar solicitudes pendientes
DROP POLICY IF EXISTS "Receivers can update connect requests" ON public.connect_requests;
CREATE POLICY "Receivers can update connect requests" ON public.connect_requests
FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id AND status = 'pending')
WITH CHECK (auth.uid() = receiver_id AND status IN ('accepted', 'rejected'));

-- 12. POLÍTICAS RLS DE CHATS (connect_chats)
-- Lectura: Solo participantes del chat
DROP POLICY IF EXISTS "Participants can view chats" ON public.connect_chats;
CREATE POLICY "Participants can view chats" ON public.connect_chats
FOR SELECT TO authenticated
USING (
  (auth.uid() = user_a_id OR auth.uid() = user_b_id)
  -- Excluir si hay bloqueo activo
  AND NOT EXISTS (
    SELECT 1 FROM public.connect_blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = CASE WHEN user_a_id = auth.uid() THEN user_b_id ELSE user_a_id END)
       OR (b.blocker_id = CASE WHEN user_a_id = auth.uid() THEN user_b_id ELSE user_a_id END AND b.blocked_id = auth.uid())
  )
);

-- Inserción: Solo permitida indirectamente si se acepta una solicitud (se validará en trigger/action)
DROP POLICY IF EXISTS "Users can insert chats" ON public.connect_chats;
CREATE POLICY "Users can insert chats" ON public.connect_chats
FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = user_a_id OR auth.uid() = user_b_id)
  -- Validar que exista una solicitud aceptada entre ambos
  AND EXISTS (
    SELECT 1 FROM public.connect_requests r
    WHERE r.status = 'accepted'
      AND ((r.sender_id = user_a_id AND r.receiver_id = user_b_id) OR (r.sender_id = user_b_id AND r.receiver_id = user_a_id))
  )
);

-- 13. POLÍTICAS RLS DE MENSAJES (connect_messages)
-- Lectura y Creación de mensajes: Solo miembros del chat y no bloqueados
DROP POLICY IF EXISTS "Chat members can read messages" ON public.connect_messages;
CREATE POLICY "Chat members can read messages" ON public.connect_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.connect_chats c
    WHERE c.id = chat_id
      AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Chat members can send messages" ON public.connect_messages;
CREATE POLICY "Chat members can send messages" ON public.connect_messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.connect_chats c
    WHERE c.id = chat_id
      AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
  )
  -- Asegurar que el remitente no ha sido bloqueado por el otro miembro del chat
  AND NOT EXISTS (
    SELECT 1 FROM public.connect_chats c
    JOIN public.connect_blocks b ON b.blocker_id = CASE WHEN c.user_a_id = auth.uid() THEN c.user_b_id ELSE c.user_a_id END
    WHERE c.id = chat_id AND b.blocked_id = auth.uid()
  )
);

-- 14. POLÍTICAS RLS DE REPORTES (connect_reports)
-- Creación de reportes
DROP POLICY IF EXISTS "Users can create reports" ON public.connect_reports;
CREATE POLICY "Users can create reports" ON public.connect_reports
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- 15. AUTO-DESCONEXIÓN EN TRIGGER DE CREACIÓN DE REPORTE (OPCIONAL/OPCIONAL)
-- Si un usuario acumula 3 reportes, se apaga su visibilidad automáticamente
CREATE OR REPLACE FUNCTION public.check_user_reports_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.connect_reports 
    WHERE reported_id = NEW.reported_id
  ) >= 3 THEN
    -- Manda a invisible su presencia en todos lados
    UPDATE public.connect_presence
    SET visibility = 'invisible'
    WHERE user_id = NEW.reported_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_reports_limit ON public.connect_reports;
CREATE TRIGGER trigger_reports_limit
AFTER INSERT ON public.connect_reports
FOR EACH ROW EXECUTE FUNCTION public.check_user_reports_limit();
