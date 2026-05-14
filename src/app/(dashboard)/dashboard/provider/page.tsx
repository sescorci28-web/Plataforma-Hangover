"use client";

import { motion } from "framer-motion";
import { BarChart3, Settings, Calendar, DollarSign, Plus, Bell } from "lucide-react";
import Link from "next/link";

const mockRequests = [
  { id: 1, user: "María G.", date: "15 Jun 2026", type: "DJ Set - Boda", status: "Nueva Solicitud", amount: "$800" },
  { id: 2, user: "Carlos R.", date: "20 Jun 2026", type: "DJ Set - Cumpleaños", status: "Pendiente", amount: "$450" },
];

export default function ProviderDashboard() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-accent-600 flex items-center justify-center text-xl font-bold">
                DN
              </div>
              <div>
                <h3 className="font-semibold text-white">DJ Neon</h3>
                <p className="text-xs text-zinc-400">Proveedor PRO</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link href="#" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-accent-400 font-medium">
                <BarChart3 className="w-5 h-5" />
                Panel
              </Link>
              <Link href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors">
                <Calendar className="w-5 h-5" />
                Calendario
              </Link>
              <Link href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors">
                <Settings className="w-5 h-5" />
                Mis Servicios
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-outfit mb-2">Panel de Proveedor</h1>
              <p className="text-zinc-400">Gestiona tus servicios y solicitudes de reserva.</p>
            </div>
            <button className="bg-accent-600 hover:bg-accent-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 glow">
              <Plus className="w-5 h-5" />
              Nuevo Servicio
            </button>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-6 border-accent-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Ingresos Mes</h4>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold">$2,450</p>
              <p className="text-xs text-emerald-400 mt-2">+12% vs mes anterior</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Próximos Eventos</h4>
                <Calendar className="w-5 h-5 text-accent-400" />
              </div>
              <p className="text-3xl font-bold">5</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Calificación</h4>
                <span className="text-yellow-400 text-xl">★</span>
              </div>
              <p className="text-3xl font-bold">4.9</p>
              <p className="text-xs text-zinc-400 mt-2">De 32 reseñas</p>
            </div>
          </div>

          {/* Incoming Requests */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Solicitudes Pendientes
                <span className="bg-accent-600 text-white text-xs px-2 py-0.5 rounded-full">2</span>
              </h2>
            </div>
            
            <div className="space-y-4">
              {mockRequests.map((req) => (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-black/40 rounded-xl border border-white/5">
                  <div className="flex items-start gap-4 mb-4 sm:mb-0">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-semibold shrink-0">
                      {req.user.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{req.user}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-300">
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400">{req.type} • {req.date}</p>
                      <p className="text-sm font-medium text-emerald-400 mt-1">{req.amount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
                      Ver Detalles
                    </button>
                    <button className="flex-1 sm:flex-none px-4 py-2 bg-accent-600 hover:bg-accent-500 rounded-lg text-sm font-medium text-white transition-colors">
                      Aceptar
                    </button>
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
