"use client";

import { useState, useEffect } from "react";
import { Heart, Share2, Copy, Check, MessageCircle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

interface EventClientInteractiveProps {
  eventId: string;
  eventTitle: string;
  eventDescription: string;
}

export function EventClientInteractive({ eventId, eventTitle, eventDescription }: EventClientInteractiveProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    // Determine share URL on client side
    setShareUrl(window.location.href);

    // Read favorites from localStorage
    try {
      const favorites = JSON.parse(localStorage.getItem("hangover_favorite_events") || "[]");
      setIsFavorited(favorites.includes(eventId));
    } catch (e) {
      console.error("Error loading favorites:", e);
    }
  }, [eventId]);

  const toggleFavorite = () => {
    try {
      const favorites = JSON.parse(localStorage.getItem("hangover_favorite_events") || "[]");
      let newFavorites;
      if (favorites.includes(eventId)) {
        newFavorites = favorites.filter((id: string) => id !== eventId);
        setIsFavorited(false);
      } else {
        newFavorites = [...favorites, eventId];
        setIsFavorited(true);
      }
      localStorage.setItem("hangover_favorite_events", JSON.stringify(newFavorites));
    } catch (e) {
      console.error("Error saving favorites:", e);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`¡Mira este evento en Hangover!: ${eventTitle}\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Favorite & Share Buttons (Floating Action) */}
      <div className="flex gap-3">
        {/* Favorite Heart Button */}
        <button
          onClick={toggleFavorite}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
            isFavorited
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
              : "bg-white/5 border-white/10 hover:border-white/20 text-zinc-300 hover:text-white"
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? "fill-rose-500 text-rose-500" : ""}`} />
          {isFavorited ? "En Favoritos" : "Guardar Evento"}
        </button>

        {/* Share Toggle Button */}
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </button>

          {/* Share Dropdown */}
          <AnimatePresence>
            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl z-50 flex flex-col gap-1"
                >
                  <button
                    onClick={shareWhatsApp}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer w-full text-left"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    WhatsApp
                  </button>
                  <button
                    onClick={shareFacebook}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer w-full text-left"
                  >
                    <FacebookIcon className="w-4 h-4 text-accent-400 shrink-0" />
                    Facebook
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer w-full text-left"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-primary-400 shrink-0" />
                        Copiar Enlace
                      </>
                    )}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sharing Section Buttons (Section 8) */}
      <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Comparte con tus amigos</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            WhatsApp
          </button>
          <button
            onClick={shareFacebook}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 hover:bg-accent-500/15 text-accent-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FacebookIcon className="w-5 h-5 shrink-0" />
            Facebook
          </button>
          <button
            onClick={copyToClipboard}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 hover:bg-primary-500/15 text-primary-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" /> : <Copy className="w-5 h-5 shrink-0" />}
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  );
}
