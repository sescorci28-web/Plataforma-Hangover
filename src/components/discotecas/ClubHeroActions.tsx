'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Heart, Share2, Ticket, Check, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toggleFavoriteClub } from '@/app/services/connectActions';

// Local SVG icon to avoid version mismatch in lucide-react
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface ClubHeroActionsProps {
  clubId: string;
  clubSlug: string;
  clubName: string;
  instagramUrl?: string | null;
  mapsUrl?: string | null;
}

export function ClubHeroActions({ clubId, clubSlug, clubName, instagramUrl, mapsUrl }: ClubHeroActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check follow state from database on mount, fallback to local storage
  useEffect(() => {
    async function checkFavorite() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('user_favorite_clubs')
          .select('id')
          .eq('user_id', user.id)
          .eq('club_id', clubId)
          .maybeSingle();
        if (!error && data) {
          setIsFollowing(true);
        }
      } else {
        try {
          const favoritesRaw = localStorage.getItem('hangover_favorite_clubs');
          if (favoritesRaw) {
            const favorites = JSON.parse(favoritesRaw) as string[];
            setIsFollowing(favorites.includes(clubId));
          }
        } catch (err) {
          console.error('Error reading favorites:', err);
        }
      }
    }
    checkFavorite();
  }, [clubId]);

  // Toggle follow state
  const handleFollowToggle = async () => {
    if (userId) {
      const nextState = !isFollowing;
      setIsFollowing(nextState);
      const res = await toggleFavoriteClub(clubId);
      if (res.error) {
        setIsFollowing(!nextState); // revert
        console.error('Error toggling favorite:', res.error);
      }
    } else {
      try {
        const favoritesRaw = localStorage.getItem('hangover_favorite_clubs');
        let favorites: string[] = [];
        if (favoritesRaw) {
          favorites = JSON.parse(favoritesRaw) as string[];
        }
        
        let nextState = false;
        if (favorites.includes(clubId)) {
          favorites = favorites.filter(id => id !== clubId);
          nextState = false;
        } else {
          favorites.push(clubId);
          nextState = true;
        }

        localStorage.setItem('hangover_favorite_clubs', JSON.stringify(favorites));
        setIsFollowing(nextState);

        // Trigger standard storage event to update other pages if open
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error('Error toggling favorite:', err);
      }
    }
  };

  // Handle book scroll & route change
  const handleBook = () => {
    // 1. Update url search param
    router.push(`?tab=bookings`, { scroll: false });
    
    // 2. Smooth scroll to tabs section after small delay
    setTimeout(() => {
      const tabsElement = document.getElementById('club-tabs-nav');
      if (tabsElement) {
        tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Handle share action
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/discotecas/${clubSlug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: clubName,
          text: `¡Mira esta discoteca en Hangover! Reservas, entradas y comanda en vivo.`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
      {/* Botones Principales */}
      <div className="flex items-center gap-3 w-full sm:w-auto flex-grow sm:flex-none">
        {/* 1. Reservar Mesa */}
        <button
          onClick={handleBook}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white text-xs font-black uppercase tracking-wider px-6 py-3.5 transition-all cursor-pointer shadow-lg shadow-primary-500/10 active:scale-95"
        >
          <Ticket className="w-4 h-4 shrink-0" />
          <span>Reservar Mesa</span>
        </button>

        {/* 2. Seguir discoteca */}
        <button
          onClick={handleFollowToggle}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
            isFollowing
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
              : 'bg-white/5 border-white/5 text-zinc-200 hover:text-white hover:bg-white/10'
          }`}
          title={isFollowing ? 'Dejar de seguir discoteca' : 'Seguir discoteca'}
        >
          <Heart className={`w-3.5 h-3.5 transition-transform shrink-0 ${isFollowing ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>{isFollowing ? 'Siguiendo' : 'Seguir Discoteca'}</span>
        </button>
      </div>

      {/* Acciones Secundarias (Iconos Pequeños w-11 h-11) */}
      <div className="flex items-center justify-center sm:justify-start gap-2.5 shrink-0">
        {/* 3. Compartir */}
        <button
          onClick={handleShare}
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/5 transition-all cursor-pointer active:scale-95 relative backdrop-blur"
          title="Compartir discoteca"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="copied"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="w-4 h-4 text-emerald-400" />
              </motion.div>
            ) : (
              <motion.div
                key="share"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Share2 className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* 4. Instagram */}
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/5 transition-all cursor-pointer active:scale-95 backdrop-blur"
            title="Ver Instagram"
          >
            <InstagramIcon className="w-4 h-4 text-pink-400" />
          </a>
        )}

        {/* 5. Cómo llegar */}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/5 transition-all cursor-pointer active:scale-95 backdrop-blur"
            title="Cómo llegar"
          >
            <MapPin className="w-4 h-4 text-accent-400" />
          </a>
        )}
      </div>
    </div>
  );
}
