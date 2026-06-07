-- Create table for Club Stories
CREATE TABLE IF NOT EXISTS public.club_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    duration INT DEFAULT 5, -- duration in seconds (defaults to 5 for images)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for club_stories
ALTER TABLE public.club_stories ENABLE ROW LEVEL SECURITY;

-- Create policies for club_stories
CREATE POLICY "Allow public read access to active club_stories" ON public.club_stories
    FOR SELECT USING (active = true);

CREATE POLICY "Allow provider write access to own club_stories" ON public.club_stories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE public.clubs.id = club_stories.club_id
              AND public.clubs.provider_id = auth.uid()
        )
    );

-- Create table for Club Gallery Items
CREATE TABLE IF NOT EXISTS public.club_gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for club_gallery_items
ALTER TABLE public.club_gallery_items ENABLE ROW LEVEL SECURITY;

-- Create policies for club_gallery_items
CREATE POLICY "Allow public read access to active club_gallery_items" ON public.club_gallery_items
    FOR SELECT USING (active = true);

CREATE POLICY "Allow provider write access to own club_gallery_items" ON public.club_gallery_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE public.clubs.id = club_gallery_items.club_id
              AND public.clubs.provider_id = auth.uid()
        )
    );

-- Setup Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-stories', 'club-stories', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('club-gallery', 'club-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for club-stories bucket
CREATE POLICY "Public Read Access for club-stories" ON storage.objects
    FOR SELECT USING (bucket_id = 'club-stories');

CREATE POLICY "Provider All Access for own club-stories" ON storage.objects
    FOR ALL USING (bucket_id = 'club-stories' AND auth.role() = 'authenticated');

-- Storage Policies for club-gallery bucket
CREATE POLICY "Public Read Access for club-gallery" ON storage.objects
    FOR SELECT USING (bucket_id = 'club-gallery');

CREATE POLICY "Provider All Access for own club-gallery" ON storage.objects
    FOR ALL USING (bucket_id = 'club-gallery' AND auth.role() = 'authenticated');
