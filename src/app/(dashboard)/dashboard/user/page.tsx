"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Ticket, Heart, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";

const mockBookings = [
  { id: 1, title: "Reserva DJ Neon", date: "24 Mayo 2026", status: "Confirmado", amount: "$350" },
  { id: 2, title: "Entradas VIP Neon Club", date: "28 Mayo 2026", status: "Pendiente", amount: "$120" },
];

export default function UserDashboard() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-xl font-bold">
                J
              </div>
              <div>
                <h3 className="font-semibold text-white">Juan Pérez</h3>
                <p className="text-xs text-zinc-400">Usuario Premium</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link href="#" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-primary-400 font-medium">
                <Ticket className="w-5 h-5" />
                Mis Reservas
              </Link>
              <Link href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors">
                <Heart className="w-5 h-5" />
                Favoritos
              </Link>
              <Link href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors">
                <CreditCard className="w-5 h-5" />
                Pagos
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <header>
            <h1 className="text-3xl font-bold font-outfit mb-2">Mi Dashboard</h1>
            <p className="text-zinc-400">Bienvenido de vuelta, organiza tu próxima fiesta.</p>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Reservas Activas</h4>
                <Calendar className="w-5 h-5 text-primary-400" />
              </div>
              <p className="text-3xl font-bold">2</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Historial</h4>
                <Clock className="w-5 h-5 text-accent-400" />
              </div>
              <p className="text-3xl font-bold">12</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Gastado</h4>
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold">$1,250</p>
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Próximos Eventos</h2>
              <Link href="#" className="text-sm text-primary-400 hover:text-primary-300">Ver todos</Link>
            </div>
            
            <div className="space-y-4">
              {mockBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-900/50 flex items-center justify-center text-primary-400">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{booking.title}</h4>
                      <p className="text-sm text-zinc-400">{booking.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-white">{booking.amount}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'Confirmado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
