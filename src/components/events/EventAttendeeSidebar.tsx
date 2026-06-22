'use client';

import { useState, useEffect } from "react";
import { Ticket, Users, ShieldCheck, Heart, AlertTriangle, Sofa } from "lucide-react";
import { toggleEventFavorite, getEventFavoriteStatus } from "@/app/events/actions";

interface EventAttendeeSidebarProps {
  eventId: string;
  ticketPrice: number;
  initialAttendeeCount: number;
  capacity: number;
  ticketBatches: any[];
  attendeeList: any[];
  user: any;
  eventTables?: any[];
  ticketCardTitle?: string;
  ticketCardDescription?: string;
  showSalesProgress?: boolean;
  showCapacity?: boolean;
  showAttendees?: string;
  showTicketBatches?: boolean;
  showRemainingTickets?: boolean;
  showWhoIsGoing?: boolean;
  eventType?: string;
  ticketingEnabled?: boolean;
  showFavorites?: boolean;
}

export function EventAttendeeSidebar({
  eventId,
  ticketPrice,
  initialAttendeeCount,
  capacity,
  ticketBatches = [],
  attendeeList = [],
  user,
  eventTables = [],
  ticketCardTitle = "Adquiere tus accesos",
  ticketCardDescription = "Tickets 100% autorizados del organizador directos al cliente.",
  showSalesProgress = true,
  showCapacity = true,
  showAttendees = "all",
  showTicketBatches = true,
  showRemainingTickets = true,
  showWhoIsGoing = true,
  eventType = "tickets",
  ticketingEnabled = true,
  showFavorites = true
}: EventAttendeeSidebarProps) {
  const [favorited, setFavorited] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  useEffect(() => {
    async function loadFavorite() {
      if (!user) return;
      const res = await getEventFavoriteStatus(eventId);
      setFavorited(res.favorited);
    }
    loadFavorite();
  }, [eventId, user]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      alert("Por favor inicia sesión para guardar este evento en tus favoritos.");
      return;
    }
    setLoadingFavorite(true);
    const res = await toggleEventFavorite(eventId);
    if (res.success) {
      setFavorited(res.favorited ?? false);
    }
    setLoadingFavorite(false);
  };

  const percentSold = Math.min(Math.round((initialAttendeeCount / capacity) * 100), 100);
  const remainingTickets = Math.max(capacity - initialAttendeeCount, 0);

  // Dynamic progress bar color: Red/Rose alert if >70%
  let progressBarColor = "from-emerald-500 to-teal-500";
  if (percentSold > 90) {
    progressBarColor = "from-rose-600 to-red-500";
  } else if (percentSold > 70) {
    progressBarColor = "from-amber-500 to-rose-500";
  }

  // Trigger tab switch to Community tab on the main page
  const navigateToCommunity = () => {
    const tabBtn = Array.from(document.querySelectorAll('button')).find(
      el => el.textContent?.includes("Comunidad")
    );
    if (tabBtn) {
      tabBtn.click();
      const offsetTop = tabBtn.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  // If ticketing is turned off completely
  if (!ticketingEnabled) {
    return (
      <div className="glass-card w-full rounded-3xl border border-white/10 bg-[#09090f]/90 p-6 shadow-xl text-center space-y-4">
        <AlertTriangle className="w-8 h-8 mx-auto text-zinc-500" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">Boletería Cerrada</h3>
        <p className="text-xs text-zinc-400">El organizador de este evento no ha habilitado la venta de accesos por el momento.</p>
        
        {showFavorites && (
          <button
            onClick={handleFavoriteToggle}
            disabled={loadingFavorite}
            className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer text-xs font-semibold ${
              favorited 
                ? "bg-rose-600/20 border-rose-500 text-rose-400" 
                : "bg-white/5 border-white/8 hover:border-white/15 text-zinc-400 hover:text-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} />
            {favorited ? "Guardado en Favoritos" : "Guardar en Favoritos"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card w-full rounded-3xl border border-white/10 bg-[#09090f]/90 p-6 shadow-[0_20px_80px_rgba(217,70,239,0.12)] space-y-6">
      {/* Ticket Header & Favorites toggle */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-300">
            <Ticket className="w-3.5 h-3.5" />
            {eventType === "free" ? "Invitación Libre" : eventType === "private" ? "Evento Privado" : "Entrada Oficial"}
          </span>

          {showFavorites && (
            <button
              onClick={handleFavoriteToggle}
              disabled={loadingFavorite}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                favorited 
                  ? "bg-rose-600/20 border-rose-500 text-rose-400" 
                  : "bg-white/5 border-white/8 hover:border-white/15 text-zinc-400 hover:text-white"
              }`}
              title={favorited ? "Quitar de favoritos" : "Guardar en favoritos"}
            >
              <Heart className={`w-4 h-4 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
          )}
        </div>
        <h3 className="text-lg font-bold text-white font-outfit">{ticketCardTitle}</h3>
        <p className="text-xs text-zinc-400">{ticketCardDescription}</p>
      </div>

      {/* Progress bar and availability */}
      {(showSalesProgress || showCapacity) && (
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 flex items-center gap-1 font-semibold">
              <strong>{initialAttendeeCount}</strong> reservados
            </span>
            {showSalesProgress && (
              <span className="text-primary-400 font-extrabold">{percentSold}% Vendido</span>
            )}
          </div>
          
          {showSalesProgress && (
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${progressBarColor} transition-all duration-500`}
                style={{ width: `${percentSold}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            {showRemainingTickets && (
              percentSold >= 90 ? (
                <span className="text-rose-400 font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                  ⚠️ ¡Últimos cupos!
                </span>
              ) : percentSold >= 70 ? (
                <span className="text-amber-400 font-bold uppercase tracking-wider">
                  🔥 Aforo casi lleno
                </span>
              ) : (
                <span>
                  {remainingTickets} entradas restantes
                </span>
              )
            )}
            {showCapacity && <span>Aforo: {capacity}</span>}
          </div>
        </div>
      )}

      {/* Tiers (Lotes) Section */}
      {showTicketBatches && ["tickets", "tickets_and_tables"].includes(eventType) && ticketBatches.length > 0 && (
        <div className="space-y-3 pt-1 border-t border-white/5">
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Lotes de Entradas</span>
          <div className="space-y-2">
            {ticketBatches.map((batch: any) => {
              const isSoldOut = batch.status === 'sold_out' || batch.sold_count >= batch.capacity;
              const isLocked = batch.status === 'locked';
              const isActive = batch.status === 'active' && !isSoldOut;

              return (
                <div
                  key={batch.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    isActive
                      ? "bg-white/[0.02] border-white/10 hover:border-white/15"
                      : isSoldOut
                      ? "bg-black/30 border-white/5 opacity-40 line-through decoration-zinc-650"
                      : "bg-black/35 border-white/5 opacity-50"
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow"
                      style={{ backgroundColor: batch.color_code || "#9333ea" }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate leading-snug">{batch.name}</p>
                      {batch.description && <p className="text-[9px] text-zinc-500 truncate mt-0.5">{batch.description}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-black shrink-0 ${isActive ? "text-emerald-400" : "text-zinc-500"}`}>
                    {isLocked ? "🔒 Bloqueado" : `$${batch.price}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tables (Mesas) Section */}
      {["tables", "tickets_and_tables"].includes(eventType) && eventTables.length > 0 && (
        <div className="space-y-3 pt-1 border-t border-white/5">
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Reserva de Mesas y Palcos VIP</span>
          <div className="space-y-2">
            {eventTables.map((table: any) => {
              const isSoldOut = table.status === 'sold_out';
              const isActive = table.status === 'active' && !isSoldOut;

              return (
                <div
                  key={table.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    isActive
                      ? "bg-white/[0.02] border-white/10 hover:border-white/15"
                      : "bg-black/30 border-white/5 opacity-45"
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-600/10 flex items-center justify-center text-primary-400 shrink-0">
                      <Sofa className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate leading-snug">{table.name}</p>
                      <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">Capacidad: {table.capacity} personas</p>
                      {table.description && <p className="text-[9px] text-zinc-400 truncate mt-0.5">{table.description}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-black shrink-0 ${isActive ? "text-emerald-400" : "text-zinc-500"}`}>
                    {isSoldOut ? "Agotado" : `$${table.price}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmed Attendees list */}
      {showWhoIsGoing && showAttendees !== "hidden" && (
        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">¿Quién va?</span>
            <span className="text-[10px] text-primary-400 font-black uppercase tracking-wider block">+{initialAttendeeCount} asistentes</span>
          </div>

          {showAttendees === "all" && (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5 overflow-hidden">
                {attendeeList.slice(0, 5).map((att: any, idx) => (
                  <div key={idx} className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-900 overflow-hidden shrink-0">
                    {att.avatar_url ? (
                      <img src={att.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary-600/20 flex items-center justify-center text-[9px] font-extrabold text-white">
                        {att.full_name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                ))}
                {attendeeList.length === 0 && (
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-primary-950/20 flex items-center justify-center text-[9px] font-bold text-zinc-650 shrink-0">
                        ?
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={navigateToCommunity}
                className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Ver todos
              </button>
            </div>
          )}
        </div>
      )}

      {/* Trust Guarantee items */}
      <div className="space-y-4 pt-3 border-t border-white/5">
        <div className="flex items-start gap-3 text-xs">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold text-zinc-200">Asistentes Registrados</p>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Conéctate con otros fiesteros en la red Hangover Connect.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-xs">
          <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold text-zinc-200">Garantía de Acceso Seguro</p>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Entradas emitidas al instante en formato QR y guardadas en tu cuenta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
