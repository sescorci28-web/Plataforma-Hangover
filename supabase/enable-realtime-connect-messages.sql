-- ============================================================
-- HANGOVER CONNECT - HABILITAR REALTIME EN MENSAJES
-- Ejecutar en el Editor SQL de Supabase
-- ============================================================

-- PASO 1: Habilitar REPLICA IDENTITY FULL en connect_messages
-- Necesario para que Supabase Realtime pueda enviar la fila completa
-- en los eventos INSERT/UPDATE/DELETE, incluyendo todos sus campos.
ALTER TABLE public.connect_messages REPLICA IDENTITY FULL;

-- PASO 2: Agregar connect_messages a la publicación supabase_realtime
-- Sin esto, Supabase Realtime NUNCA emitirá eventos de esta tabla,
-- sin importar cómo esté configurada la suscripción en el cliente.
ALTER PUBLICATION supabase_realtime ADD TABLE public.connect_messages;

-- PASO 3: Habilitar REPLICA IDENTITY FULL en connect_chats también
-- Necesario para detectar nuevos chats en tiempo real.
ALTER TABLE public.connect_chats REPLICA IDENTITY FULL;

-- PASO 4: Agregar connect_chats a la publicación
ALTER PUBLICATION supabase_realtime ADD TABLE public.connect_chats;

-- Verificación: listar tablas en la publicación supabase_realtime
-- (ejecutar para confirmar que las tablas quedaron incluidas)
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
