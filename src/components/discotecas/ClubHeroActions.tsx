'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Heart, Share2, Ticket, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClubHeroActionsProps {
  clubId: string;
  clubSlug: string;
  clubName: string;
}

export function ClubHeroActions({ clubId, clubSlug, clubName }: ClubHeroActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check follow state from local storage on mount
  useEffect(() => {
    try {
      const favoritesRaw = localStorage.getItem('hangover_favorite_clubs');
      if (favoritesRaw) {
        const favorites = JSON.parse(favoritesRaw) as string[];
        setIsFollowing(favorites.includes(clubId));
      }
    } catch (err) {
      console.error('Error reading favorites:', err);
    }
  }, [clubId]);

  // Toggle follow state
  const handleFollowToggle = () => {
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
    <div className="flex items-center gap-3 w-full sm:w-auto">
      {/* 1. Reservar button */}
      <button
        onClick={handleBook}
        className="flex-grow sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white text-xs font-black uppercase tracking-wider px-6 py-3 transition-all cursor-pointer shadow-lg shadow-primary-500/10 active:scale-95"
      >
        <Ticket className="w-4 h-4 shrink-0" />
        <span>Reservar Mesa</span>
      </button>

      {/* 2. Compartir button */}
      <button
        onClick={handleShare}
        className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95 relative"
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

      {/* 3. Seguir button */}
      <button
        onClick={handleFollowToggle}
        className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border transition-all cursor-pointer active:scale-95 ${
          isFollowing
            ? 'bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/30'
            : 'bg-white/10 border-white/10 text-zinc-200 hover:text-white hover:bg-white/15'
        }`}
        title={isFollowing ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        <Heart className={`w-4 h-4 transition-transform ${isFollowing ? 'fill-red-500 scale-110' : ''}`} />
      </button>
    </div>
  );
}
