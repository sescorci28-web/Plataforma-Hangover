-- ==========================================================
-- SEED MULTIMEDIA DEMO DATA FOR PLATAFORMA HANGOVER
-- Run this in your Supabase SQL Editor to populate the clubs
-- ==========================================================

-- 1. Seed Stories for Hangover Club
INSERT INTO public.club_stories (club_id, url, media_type, thumbnail_url, title, description, display_order, active, featured, duration)
VALUES 
('93441c83-d379-4649-af7a-1f31e0c28aa1', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&auto=format&fit=crop', 'image', NULL, 'Ambiente', 'La mejor energía de la noche', 1, true, true, 5),
('93441c83-d379-4649-af7a-1f31e0c28aa1', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1080&auto=format&fit=crop', 'image', NULL, 'DJ', 'Line-up de este fin de semana', 2, true, false, 5),
('93441c83-d379-4649-af7a-1f31e0c28aa1', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1080&auto=format&fit=crop', 'image', NULL, 'Coctelería', 'Tragos premium para la mesa VIP', 3, true, false, 5),
('93441c83-d379-4649-af7a-1f31e0c28aa1', 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1080&auto=format&fit=crop', 'image', NULL, 'Evento', 'Próximo show este viernes', 4, true, true, 5)
ON CONFLICT DO NOTHING;

-- 2. Seed Gallery for Hangover Club (4 images, 2 videos)
INSERT INTO public.club_gallery_items (club_id, url, media_type, thumbnail_url, title, description, display_order, active, featured)
VALUES
('93441c83-d379-4649-af7a-1f31e0c28aa1', 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=1080&auto=format&fit=crop', 'image', NULL, 'Zona VIP Premium', 'Mesas exclusivas con atención personalizada.', 1, true, true),
('93441c83-d379-4649-af7a-1f31e0c28aa1', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&auto=format&fit=crop', 'image', NULL, 'Pista de Baile', 'Energía y luces en la pista principal.', 2, true, false),
('93441c83-d379-4649-af7a-1f31e0c28aa1', 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1080&auto=format&fit=crop', 'image', NULL, 'Coctelería Exclusiva', 'Tragos diseñados por nuestros mixólogos.', 3, true, false),
('93441c83-d379-4649-af7a-1f31e0c28aa1', 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=1080&auto=format&fit=crop', 'image', NULL, 'DJ Set en Vivo', 'Los mejores exponentes nacionales e internacionales.', 4, true, false),
('93441c83-d379-4649-af7a-1f31e0c28aa1', 'https://assets.mixkit.co/videos/preview/mixkit-people-dancing-at-a-party-with-neon-lights-40013-large.mp4', 'video', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&auto=format&fit=crop', 'Ambiente en Luces Neon', 'Una experiencia visual única bajo luces ultravioleta.', 5, true, true),
('93441c83-d379-4649-af7a-1f31e0c28aa1', 'https://assets.mixkit.co/videos/preview/mixkit-dj-playing-music-at-a-club-42292-large.mp4', 'video', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1080&auto=format&fit=crop', 'Performance de DJ', 'Sincronización perfecta de audio y efectos especiales.', 6, true, true)
ON CONFLICT DO NOTHING;

-- 3. Seed Stories for Dulcinea Medellín
INSERT INTO public.club_stories (club_id, url, media_type, thumbnail_url, title, description, display_order, active, featured, duration)
VALUES 
('4bc024cb-a730-4c46-b048-d641562f45e5', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&auto=format&fit=crop', 'image', NULL, 'Ambiente', 'La mejor energía de la noche', 1, true, true, 5),
('4bc024cb-a730-4c46-b048-d641562f45e5', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1080&auto=format&fit=crop', 'image', NULL, 'DJ', 'Line-up de este fin de semana', 2, true, false, 5),
('4bc024cb-a730-4c46-b048-d641562f45e5', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1080&auto=format&fit=crop', 'image', NULL, 'Coctelería', 'Tragos premium para la mesa VIP', 3, true, false, 5),
('4bc024cb-a730-4c46-b048-d641562f45e5', 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1080&auto=format&fit=crop', 'image', NULL, 'Evento', 'Próximo show este viernes', 4, true, true, 5)
ON CONFLICT DO NOTHING;

-- 4. Seed Gallery for Dulcinea Medellín (4 images, 2 videos)
INSERT INTO public.club_gallery_items (club_id, url, media_type, thumbnail_url, title, description, display_order, active, featured)
VALUES
('4bc024cb-a730-4c46-b048-d641562f45e5', 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=1080&auto=format&fit=crop', 'image', NULL, 'Zona VIP Premium', 'Mesas exclusivas con atención personalizada.', 1, true, true),
('4bc024cb-a730-4c46-b048-d641562f45e5', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&auto=format&fit=crop', 'image', NULL, 'Pista de Baile', 'Energía y luces en la pista principal.', 2, true, false),
('4bc024cb-a730-4c46-b048-d641562f45e5', 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1080&auto=format&fit=crop', 'image', NULL, 'Coctelería Exclusiva', 'Tragos diseñados por nuestros mixólogos.', 3, true, false),
('4bc024cb-a730-4c46-b048-d641562f45e5', 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=1080&auto=format&fit=crop', 'image', NULL, 'DJ Set en Vivo', 'Los mejores exponentes nacionales e internacionales.', 4, true, false),
('4bc024cb-a730-4c46-b048-d641562f45e5', 'https://assets.mixkit.co/videos/preview/mixkit-people-dancing-at-a-party-with-neon-lights-40013-large.mp4', 'video', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&auto=format&fit=crop', 'Ambiente en Luces Neon', 'Una experiencia visual única bajo luces ultravioleta.', 5, true, true),
('4bc024cb-a730-4c46-b048-d641562f45e5', 'https://assets.mixkit.co/videos/preview/mixkit-dj-playing-music-at-a-club-42292-large.mp4', 'video', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1080&auto=format&fit=crop', 'Performance de DJ', 'Sincronización perfecta de audio y efectos especiales.', 6, true, true)
ON CONFLICT DO NOTHING;
