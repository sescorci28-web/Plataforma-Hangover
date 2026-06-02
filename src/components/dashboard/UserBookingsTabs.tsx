"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, History, ArrowRight, CalendarOff, Clock, Tag, QrCode, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserBookingsTabsProps {
  initialBookings: any[];
}

export function UserBookingsTabs({ initialBookings }: UserBookingsTabsProps) {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const safeBookings = Array.isArray(initialBookings) ? initialBookings : [];

  const activeBookings = safeBookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed"
  );
  const historyBookings = safeBookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled" || b.status === "rejected"
  );

  const displayedBookings = activeTab === "active" ? activeBookings : historyBookings;

  return (
    <div className="space-y-6">
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
              const formattedDate = new Date(booking.displayDate || booking.reservation_date || booking.event_date).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              });

              const title = booking.title || booking.club_name || booking.club_slug || "Reserva de discoteca";

              return (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-black/60 transition-all gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary-950/40 text-primary-400 border border-primary-500/10">
                      <Tag className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h4 className="font-semibold text-white text-md tracking-tight leading-tight">
                          {title}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                          booking.booking_type === "club_cover"
                            ? "bg-accent-500/10 text-accent-300 border-accent-500/20"
                            : booking.booking_type === "event"
                            ? "bg-primary-500/10 text-primary-300 border-primary-500/20"
                            : booking.booking_type === "club_vip"
                            ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                            : "bg-zinc-500/10 text-zinc-300 border-zinc-500/20"
                        }`}>
                          {booking.booking_type === "club_cover"
                            ? "Cover Entrada"
                            : booking.booking_type === "event"
                            ? "Entrada Evento"
                            : booking.booking_type === "club_vip"
                            ? "Mesa VIP"
                            : booking.booking_type === "service"
                            ? "Servicio"
                            : "Reserva"}
                        </span>
                      </div>

                      <p className="text-zinc-400 text-xs flex items-center gap-1.5 capitalize">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        {formattedDate}
                      </p>

                      {booking.number_of_people ? (
                        <p className="text-zinc-500 text-[11px] mt-1">
                          {booking.number_of_people} personas
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-1.5">
                      <p className="text-sm font-semibold text-white tracking-tight">${Math.round(booking.total_amount).toLocaleString('es-CO')} COP</p>

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

                    {(booking.status === "confirmed" || booking.status === "completed") && booking.qr_code && (
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/30 hover:border-primary-500/50 rounded-xl text-xs font-semibold text-primary-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Ver QR</span>
                      </button>
                    )}

                    {!((booking.status === "confirmed" || booking.status === "completed") && booking.qr_code) && (
                      <ArrowRight className="w-5 h-5 text-zinc-500 shrink-0 hidden sm:block" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
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
                    ? "Reserva mesas VIP, botellas y accesos rápidos para tu próxima noche."
                    : "Aquí aparecerán las reservas finalizadas o canceladas de tus salidas anteriores."}
                </p>
              </div>

              {activeTab === "active" && (
                <div className="pt-2">
                  <Link
                    href="/discotecas"
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 px-5 text-xs font-semibold transition-all glow cursor-pointer"
                  >
                    Explorar Discotecas
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal para mostrar el QR */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass-card w-full max-w-sm p-6 bg-[#0c0c14] border border-white/10 rounded-3xl relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary-600/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-accent-600/10 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white font-outfit">Tu Entrada QR</h3>
                  <p className="text-xs text-zinc-400">Presenta este código en la entrada del establecimiento</p>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-2xl inline-block shadow-[0_0_20px_rgba(217,70,239,0.15)]">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedBooking.qr_code}`}
                    alt="Código QR de Acceso"
                    className="w-48 h-48 block"
                    loading="lazy"
                  />
                </div>

                {/* Detail Box */}
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">{selectedBooking.title}</h4>
                      <p className="text-[10px] text-accent-400 font-semibold uppercase tracking-wider mt-0.5">
                        {selectedBooking.booking_type === "club_cover"
                          ? "Cover Entrada"
                          : selectedBooking.booking_type === "event"
                          ? "Entrada Evento"
                          : selectedBooking.booking_type === "club_vip"
                          ? "Mesa VIP"
                          : selectedBooking.booking_type === "service"
                          ? "Servicio"
                          : "Reserva"}
                      </p>
                      <p className="text-[11px] text-zinc-400 capitalize mt-1">
                        {new Date(selectedBooking.displayDate || selectedBooking.reservation_date || selectedBooking.event_date).toLocaleDateString("es-ES", {
                          weekday: "short",
                          day: "numeric",
                          month: "short"
                        })}
                      </p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border capitalize font-bold tracking-wider ${
                      selectedBooking.qr_status === "used"
                        ? "bg-red-500/10 text-red-300 border-red-500/20"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                    }`}>
                      {selectedBooking.qr_status === "used" ? "usado" : "activo"}
                    </span>
                  </div>

                  <div className="border-t border-white/5 pt-2 flex justify-between items-center text-xs text-zinc-400">
                    <span>Identificador:</span>
                    <span className="font-mono text-[10px] text-zinc-300">{selectedBooking.qr_code}</span>
                  </div>

                  {selectedBooking.number_of_people && (
                    <div className="flex justify-between items-center text-xs text-zinc-400">
                      <span>Personas:</span>
                      <span className="text-zinc-300 font-semibold">{selectedBooking.number_of_people}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span>Precio total:</span>
                    <span className="text-emerald-400 font-bold">${Math.round(selectedBooking.total_amount).toLocaleString('es-CO')} COP</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
