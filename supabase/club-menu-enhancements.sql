-- Agregar columnas a la tabla de productos de la carta
ALTER TABLE public.club_menu_items
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true NOT NULL;
