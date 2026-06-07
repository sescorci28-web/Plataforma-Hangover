-- Expand the services table schema for the premium marketplace
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '4 horas';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS includes TEXT[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS excludes TEXT[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS response_time TEXT DEFAULT 'Menos de 1 hora';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS badge_status TEXT CHECK (badge_status IN ('top_provider', 'most_booked', 'featured')) DEFAULT NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS availability_status TEXT CHECK (availability_status IN ('available', 'busy', 'offline')) DEFAULT 'available';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS next_available_date DATE DEFAULT NULL;

-- Index for fast lookup by slug
CREATE INDEX IF NOT EXISTS services_slug_idx ON public.services(slug);

-- Update existing records to have a valid initial slug
UPDATE public.services
SET slug = regexp_replace(regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')
WHERE slug IS NULL;

-- If any slugs end up duplicate, append the first 8 characters of their UUID
UPDATE public.services s1
SET slug = slug || '-' || substring(id::text from 1 for 8)
WHERE (SELECT count(*) FROM public.services s2 WHERE s2.slug = s1.slug) > 1;
