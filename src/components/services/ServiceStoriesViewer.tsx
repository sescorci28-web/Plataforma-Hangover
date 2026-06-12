'use client';

import { StoriesGallery } from "@/components/discotecas/StoriesGallery";

interface ServiceStoriesViewerProps {
  serviceName: string;
  providerName: string;
  avatarUrl: string | null | undefined;
  coverUrl: string | null | undefined;
  stories: any[];
}

export function ServiceStoriesViewer({
  serviceName,
  providerName,
  avatarUrl,
  coverUrl,
  stories
}: ServiceStoriesViewerProps) {
  // Map service stories schema (url, media_type, duration, title) to StoryItem format
  const formattedStories = stories.map((s) => ({
    id: s.id,
    label: s.title || s.label || 'Historia',
    image: s.media_type === 'video' ? (s.thumbnail_url || s.url) : s.url,
    url: s.url,
    media_type: s.media_type as 'image' | 'video',
    duration: s.duration || 5,
    featured: s.featured || false,
  }));

  return (
    <StoriesGallery
      ownerType="user"
      ownerName={providerName}
      ownerAvatar={avatarUrl}
      ownerCover={coverUrl}
      stories={formattedStories}
    />
  );
}
