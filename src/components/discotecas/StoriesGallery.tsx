'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StoryItem {
  id: string;
  label?: string | null;
  title?: string | null;
  image?: string;
  url?: string;
  thumbnail_url?: string | null;
  media_type?: 'image' | 'video';
  duration?: number;
  featured?: boolean;
}

interface StoriesGalleryProps {
  // New generic props
  ownerType?: 'club' | 'event' | 'user';
  ownerName?: string;
  ownerAvatar?: string | null;
  ownerCover?: string | null;

  // Backward compatibility:
  logo?: string | null;
  bannerImage?: string | null;
  clubName?: string;

  stories?: StoryItem[];
  isProvider?: boolean;
  onNavigateToEvents?: () => void;
}

export function StoriesGallery({
  ownerType = 'club',
  ownerName,
  ownerAvatar,
  ownerCover,
  logo,
  bannerImage,
  clubName,
  stories = [],
  isProvider = false,
  onNavigateToEvents,
}: StoriesGalleryProps) {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const resolvedOwnerType = ownerType;
  const resolvedName = ownerName || clubName || 'Discoteca';
  const resolvedAvatar = ownerAvatar !== undefined ? ownerAvatar : logo;
  const resolvedCover = ownerCover !== undefined ? ownerCover : bannerImage;

  // Parse and build stories array (prioritizing DB stories, with demo fallbacks if showDemo is true or empty)
  const storiesList = useMemo(() => {
    const activeStories = (stories && stories.length > 0) ? stories : [
      { 
        id: "ambiente", 
        label: "Ambiente", 
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop",
        url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop",
        media_type: 'image' as const,
        duration: 5,
        featured: true,
      },
      { 
        id: "dj", 
        label: "DJ", 
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop",
        url: "https://assets.mixkit.co/videos/preview/mixkit-dj-playing-music-at-a-club-42292-large.mp4",
        media_type: 'video' as const,
        duration: 10,
        featured: false,
      },
      { 
        id: "barra", 
        label: "Coctelería", 
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop",
        url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop",
        media_type: 'image' as const,
        duration: 5,
        featured: false,
      },
      { 
        id: "evento", 
        label: "Evento", 
        image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop",
        url: "https://assets.mixkit.co/videos/preview/mixkit-people-dancing-at-a-party-with-neon-lights-40013-large.mp4",
        media_type: 'video' as const,
        duration: 15,
        featured: true,
      }
    ];

    return activeStories.map((s) => ({
      id: s.id,
      label: s.label || s.title || 'Historia',
      image: s.media_type === 'video' ? (s.thumbnail_url || s.image || s.url || '') : (s.url || s.image || ''),
      url: s.url || s.image || '',
      media_type: s.media_type || 'image',
      duration: s.duration || 5,
      featured: s.featured || false,
    }));
  }, [stories, resolvedAvatar, resolvedCover]);

  // Synchronize HTML5 video playback with isPlaying state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch((err) => console.log('Error playing story video:', err));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, activeStoryIndex]);

  // Progress bar auto-advance timer
  useEffect(() => {
    if (activeStoryIndex === null || !isPlaying) return;

    const currentStory = storiesList[activeStoryIndex];
    // Use the video's loaded duration or fall back to metadata duration
    const currentDuration = currentStory.media_type === 'video' && videoDuration
      ? videoDuration
      : (currentStory.duration || 5);

    const step = 100 / (currentDuration * 10); // step increment every 100ms

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex, isPlaying, storiesList, videoDuration]);

  const handleOpenStory = (index: number) => {
    setVideoDuration(null);
    setActiveStoryIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleCloseStory = () => {
    setActiveStoryIndex(null);
    setVideoDuration(null);
  };

  const handleNextStory = () => {
    setActiveStoryIndex((prev) => {
      if (prev === null) return null;
      setVideoDuration(null);
      setProgress(0);
      setIsPlaying(true);
      if (prev >= storiesList.length - 1) {
        return 0; // Wrap around to first
      }
      return prev + 1;
    });
  };

  const handlePrevStory = () => {
    setActiveStoryIndex((prev) => {
      if (prev === null) return null;
      setVideoDuration(null);
      setProgress(0);
      setIsPlaying(true);
      if (prev <= 0) {
        return storiesList.length - 1; // Wrap around to last
      }
      return prev - 1;
    });
  };

  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    if (video && video.duration) {
      setVideoDuration(video.duration);
    }
  };

  if (stories.length === 0 && !showDemo) {
    return (
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 font-outfit pl-1">
          📸 Historias de {resolvedName}
        </h3>
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-[28px] bg-zinc-950/20 text-center space-y-4 shadow-lg">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider font-outfit">
              {resolvedOwnerType === 'club' 
                ? "📸 Esta discoteca aún no ha publicado historias."
                : `📸 No hay historias para este ${resolvedOwnerType === 'event' ? 'evento' : 'usuario'}.`}
            </p>
            <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
              {resolvedOwnerType === 'club' 
                ? "Comparte momentos, promociones y experiencias para conectar con tus visitantes."
                : "Vuelve más tarde para ver el contenido compartido en tiempo real."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowDemo(true)}
              className="bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] font-black uppercase tracking-widest px-4 py-3 min-h-[44px] rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center"
            >
              ✨ Ver demo visual
            </button>
            {resolvedOwnerType === 'club' && onNavigateToEvents && (
              <button
                onClick={onNavigateToEvents}
                className="bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest px-4.5 py-3 min-h-[44px] rounded-xl transition-all shadow-md shadow-primary-500/10 cursor-pointer flex items-center justify-center"
              >
                Ver eventos
              </button>
            )}
            {isProvider && (
              <a
                href="/dashboard/provider/clubs"
                className="bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest px-4.5 py-3 min-h-[44px] rounded-xl transition-all shadow-md shadow-primary-500/10 cursor-pointer flex items-center justify-center"
              >
                Agregar historias
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 font-outfit pl-1">
        📸 Historias de {resolvedName}
      </h3>
      
      {/* Stories horizontal bubble row */}
      <div className="flex items-center gap-5 overflow-x-auto pb-4 pt-1 scrollbar-hide shrink-0">
        {storiesList.map((story, index) => {
          const isVideo = story.media_type === 'video';
          
          return (
            <button
              key={story.id}
              onClick={() => handleOpenStory(index)}
              className="flex flex-col items-center gap-2 focus:outline-none shrink-0 group cursor-pointer"
            >
              {/* Story Ring Wrapper */}
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-primary-500 via-purple-500 to-accent-500 group-hover:scale-105 transition-transform duration-300">
                <div className="p-0.5 bg-zinc-950 rounded-full">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border border-white/5 relative">
                    <img
                      src={story.image}
                      alt={story.label}
                      className="w-full h-full object-cover rounded-full filter brightness-90 group-hover:brightness-100 transition-all"
                    />
                    
                    {/* Play indicator overlay on thumbnail */}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 rounded-full">
                        <Play className="w-4.5 h-4.5 text-white/90 fill-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Featured Star */}
                {story.featured && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow border border-zinc-950">
                    ★
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase tracking-wider">
                {story.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fullscreen Story Viewer Modal */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <div className="fixed inset-0 z-55 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            
            {/* Left and Right navigation desktop triggers */}
            <button
              onClick={handlePrevStory}
              className="absolute left-6 hidden md:flex w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white border border-white/10 transition-all cursor-pointer z-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNextStory}
              className="absolute right-6 hidden md:flex w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white border border-white/10 transition-all cursor-pointer z-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Main story container block (forced 9:16 vertical aspect ratio) */}
            <div className="relative w-full max-w-md aspect-[9/16] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between bg-[#050508]">
              
              {/* Top progress bar lines */}
              <div className="absolute top-4 inset-x-4 z-20 flex gap-1">
                {storiesList.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    {idx < activeStoryIndex && <div className="h-full bg-white w-full" />}
                    {idx === activeStoryIndex && (
                      <div className="h-full bg-white transition-all duration-100" style={{ width: `${progress}%` }} />
                    )}
                    {idx > activeStoryIndex && <div className="h-full bg-white w-0" />}
                  </div>
                ))}
              </div>

              {/* Story header info bar */}
              <div className="absolute top-8 inset-x-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent p-2 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-zinc-900">
                    <img src={resolvedAvatar || resolvedCover || ""} alt={resolvedName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-bold font-outfit leading-none">{resolvedName}</h4>
                    <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">
                      {storiesList[activeStoryIndex].label}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Pause / Play */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  {/* Close */}
                  <button
                    onClick={handleCloseStory}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Fullscreen story media content */}
              <div className="flex-grow w-full h-full relative flex items-center justify-center bg-black">
                {storiesList[activeStoryIndex].media_type === 'video' ? (
                  <video
                    ref={videoRef}
                    src={storiesList[activeStoryIndex].url}
                    onLoadedMetadata={handleVideoMetadata}
                    onEnded={handleNextStory}
                    playsInline
                    autoPlay
                    preload="metadata"
                    className="w-full h-full object-cover aspect-[9/16]"
                  />
                ) : (
                  <img
                    src={storiesList[activeStoryIndex].url}
                    alt={storiesList[activeStoryIndex].label}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
              </div>

              {/* Bottom tag or footer callout if any */}
              <div className="absolute bottom-6 inset-x-6 z-20 text-center">
                <span className="text-[10px] text-primary-300 bg-primary-950/80 border border-primary-500/20 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider">
                  🔥 Toca o desliza para avanzar
                </span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
