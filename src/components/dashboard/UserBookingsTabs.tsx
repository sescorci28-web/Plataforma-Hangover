"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, History, ArrowRight, CalendarOff, Clock, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserBookingsTabsProps {
  initialBookings: any[];
}

export function UserBookingsTabs({ initialBookings }: UserBookingsTabsProps) {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  const activeBookings = initialBookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed"
  );
  const historyBookings = initialBookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled" || b.status === "rejected"
  );

  const displayedBookings = activeTab === "active" ? activeBookings : historyBookings;

  return (
    <div className="space-y-6">
      {/* Tabs Selector */}
      <div className="flex border-b border-white/5 pb-px">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "active"
              ? "border-primary-500 text-white"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Reservas Activas
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
            activeTab === "active" ? "bg-primary-600/30 text-primary-300" : "bg-white/5 text-zinc-400"
          }`}>
            {activeBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "history"
              ? "border-primary-500 text-white"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <History className="w-4 h-4" />
          Historial / Pasadas
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
            activeTab === "history" ? "bg-primary-600/30 text-primary-300" : "bg-white/5 text-zinc-400"
          }`}>
            {historyBookings.length}
          </span>
        </button>
      </div>

      {/* Bookings List / Empty State */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {displayedBookings.length > 0 ? (
            displayedBookings.map((booking) => {
              const formattedDate = new Date(booking.event_date).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              });

              // Check if it's a service or an event booking
              const title = booking.services?.title || booking.events?.title || "Servicio Contratado";
              const isEvent = !!booking.events;

              return (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-black/60 transition-all gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isEvent 
                        ? "bg-rose-950/40 text-rose-400 border border-rose-500/10" 
                        : "bg-primary-950/40 text-primary-400 border border-primary-500/10"
                    }`}>
                      <Tag className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h4 className="font-semibold text-white text-md tracking-tight leading-tight">
                          {title}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isEvent 
                            ? "bg-rose-500/10 text-rose-300 border border-rose-500/20" 
                            : "bg-primary-500/10 text-primary-300 border border-primary-500/20"
                        }`}>
                          {isEvent ? "Entrada" : "Servicio"}
                        </span>
                      </div>

                      <p className="text-zinc-400 text-xs flex items-center gap-1.5 capitalize">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        {formattedDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-white tracking-tight">${booking.total_amount}</p>
                      
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border capitalize font-bold tracking-wider ${
                        booking.status === "confirmed"
                          ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                          : booking.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                          : booking.status === "pending"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                          : "bg-red-500/10 text-red-300 border-red-500/20"
                      }`}>
                        {booking.status === "confirmed"
                          ? "confirmada"
                          : booking.status === "completed"
                          ? "completada"
                          : booking.status === "pending"
                          ? "pendiente"
                          : "cancelada"}
                      </span>
                    </div>

                    <ArrowRight className="w-5 h-5 text-zinc-500 shrink-0 hidden sm:block" />
                  </div>
                </div>
              );
            })
          ) : (
            /* Premium Empty State */
            <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-5 border-dashed border-white/5">
              <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center mx-auto text-zinc-500">
                <CalendarOff className="w-8 h-8 text-zinc-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">
                  {activeTab === "active" ? "No tienes reservas activas" : "Historial de reservas vacío"}
                </h3>
                <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                  {activeTab === "active"
                    ? "Reserva DJs profesionales, barras móviles, catering y personal para tu próximo gran evento."
                    : "Aquí aparecerán los servicios finalizados o cancelados de tus eventos previos."}
                </p>
              </div>

              {activeTab === "active" && (
                <div className="pt-2">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 px-5 text-xs font-semibold transition-all glow cursor-pointer"
                  >
                    Explorar Servicios
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
