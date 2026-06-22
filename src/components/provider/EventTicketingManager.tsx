"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Ticket, Sliders, Layers, BarChart3, Loader2, Save, Plus, 
  Trash2, Edit, Check, X, ShieldAlert, Sparkles, DollarSign, 
  Users, Activity, QrCode, Play, Eye, Flame, Clock, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Event {
  id: string;
  title: string;
  ticket_price: number;
  event_date: string;
  location: string;
  // new config fields
  ticketing_enabled?: boolean;
  event_type?: string;
  ticket_card_title?: string;
  ticket_card_description?: string;
  show_sales_progress?: boolean;
  show_capacity?: boolean;
  show_attendees?: string;
  show_ticket_batches?: boolean;
  show_favorites?: boolean;
  show_countdown?: boolean;
  show_remaining_tickets?: boolean;
  show_statistics?: boolean;
  show_who_is_going?: boolean;
  show_event_chat?: boolean;
  show_event_community?: boolean;
}

interface EventTicketingManagerProps {
  events: Event[];
}

export function EventTicketingManager({ events = [] }: EventTicketingManagerProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"settings" | "batches" | "tables" | "sales">("settings");
  
  const supabase = createClient();

  // Load selected event
  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Set initial event selection
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // State for Event Settings
  const [settings, setSettings] = useState<any>({
    ticketing_enabled: true,
    event_type: "tickets",
    ticket_card_title: "Adquiere tus accesos",
    ticket_card_description: "Tickets 100% autorizados del organizador directos al cliente.",
    show_sales_progress: true,
    show_capacity: true,
    show_attendees: "all",
    show_ticket_batches: true,
    show_favorites: true,
    show_countdown: true,
    show_remaining_tickets: true,
    show_statistics: true,
    show_who_is_going: true,
    show_event_chat: true,
    show_event_community: true,
  });

  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // State for Batches & Tables
  const [batches, setBatches] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Load event-specific details (settings, batches, tables)
  useEffect(() => {
    if (!selectedEventId) return;
    
    async function loadEventDetails() {
      setLoadingSettings(true);
      setErrorMsg("");
      setSuccessMsg("");
      
      try {
        // 1. Fetch Event configuration values (since page.tsx passed original events, we query again to get latest custom fields)
        const { data: eventData, error: eventErr } = await supabase
          .from("events")
          .select("*")
          .eq("id", selectedEventId)
          .single();

        if (eventErr) throw eventErr;

        setSettings({
          ticketing_enabled: eventData.ticketing_enabled ?? true,
          event_type: eventData.event_type ?? "tickets",
          ticket_card_title: eventData.ticket_card_title ?? "Adquiere tus accesos",
          ticket_card_description: eventData.ticket_card_description ?? "Tickets 100% autorizados del organizador directos al cliente.",
          show_sales_progress: eventData.show_sales_progress ?? true,
          show_capacity: eventData.show_capacity ?? true,
          show_attendees: eventData.show_attendees ?? "all",
          show_ticket_batches: eventData.show_ticket_batches ?? true,
          show_favorites: eventData.show_favorites ?? true,
          show_countdown: eventData.show_countdown ?? true,
          show_remaining_tickets: eventData.show_remaining_tickets ?? true,
          show_statistics: eventData.show_statistics ?? true,
          show_who_is_going: eventData.show_who_is_going ?? true,
          show_event_chat: eventData.show_event_chat ?? true,
          show_event_community: eventData.show_event_community ?? true,
        });

        // 2. Fetch Batches
        const { data: batchesData, error: batchesErr } = await supabase
          .from("event_ticket_batches")
          .select("*")
          .eq("event_id", selectedEventId)
          .order("display_order", { ascending: true });
        
        if (batchesErr) console.error("Error loading batches:", batchesErr);
        setBatches(batchesData || []);

        // 3. Fetch Tables
        const { data: tablesData, error: tablesErr } = await supabase
          .from("event_tables")
          .select("*")
          .eq("event_id", selectedEventId)
          .order("created_at", { ascending: true });

        if (tablesErr) console.error("Error loading tables:", tablesErr);
        setTables(tablesData || []);

      } catch (err: any) {
        console.error("Error loading event settings details:", err);
        setErrorMsg("Error al conectar con la base de datos para cargar configuraciones.");
      } finally {
        setLoadingSettings(false);
      }
    }

    loadEventDetails();
  }, [selectedEventId]);

  // Save general settings
  const handleSaveSettings = async () => {
    if (!selectedEventId) return;
    setSavingSettings(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase
        .from("events")
        .update({
          ticketing_enabled: settings.ticketing_enabled,
          event_type: settings.event_type,
          ticket_card_title: settings.ticket_card_title,
          ticket_card_description: settings.ticket_card_description,
          show_sales_progress: settings.show_sales_progress,
          show_capacity: settings.show_capacity,
          show_attendees: settings.show_attendees,
          show_ticket_batches: settings.show_ticket_batches,
          show_favorites: settings.show_favorites,
          show_countdown: settings.show_countdown,
          show_remaining_tickets: settings.show_remaining_tickets,
          show_statistics: settings.show_statistics,
          show_who_is_going: settings.show_who_is_going,
          show_event_chat: settings.show_event_chat,
          show_event_community: settings.show_event_community,
        })
        .eq("id", selectedEventId);

      if (error) throw error;
      setSuccessMsg("¡Ajustes de Boletería y Privacidad guardados con éxito!");
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setErrorMsg("Error al guardar ajustes: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // ----------------------------------------------------
  // BATCH CREATION & REMOVAL LITE FORM
  // ----------------------------------------------------
  const [newBatch, setNewBatch] = useState({
    name: "",
    description: "",
    price: "",
    capacity: "",
    color_code: "#9333ea",
    status: "active",
    display_order: "0"
  });
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name.trim()) return alert("Nombre de lote requerido");
    const priceNum = Number(newBatch.price) || 0;
    const capacityNum = Number(newBatch.capacity) || 100;
    
    setSubmittingBatch(true);
    try {
      const { data, error } = await supabase
        .from("event_ticket_batches")
        .insert({
          event_id: selectedEventId,
          name: newBatch.name.trim(),
          description: newBatch.description.trim() || null,
          price: priceNum,
          capacity: capacityNum,
          color_code: newBatch.color_code,
          status: newBatch.status,
          display_order: Number(newBatch.display_order) || 0
        })
        .select()
        .single();

      if (error) throw error;
      setBatches(prev => [...prev, data].sort((a,b) => a.display_order - b.display_order));
      setNewBatch({
        name: "",
        description: "",
        price: "",
        capacity: "",
        color_code: "#9333ea",
        status: "active",
        display_order: "0"
      });
      setSuccessMsg("Lote de entradas creado exitosamente.");
    } catch (err: any) {
      alert("Error creando lote: " + err.message);
    } finally {
      setSubmittingBatch(false);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este lote?")) return;
    try {
      const { error } = await supabase
        .from("event_ticket_batches")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setBatches(prev => prev.filter(b => b.id !== id));
      setSuccessMsg("Lote eliminado con éxito.");
    } catch (err: any) {
      alert("Error eliminando lote: " + err.message);
    }
  };

  // ----------------------------------------------------
  // TABLE CREATION & REMOVAL FORM
  // ----------------------------------------------------
  const [newTable, setNewTable] = useState({
    name: "",
    price: "",
    capacity: "",
    description: "",
    image_url: "",
    status: "active"
  });
  const [submittingTable, setSubmittingTable] = useState(false);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.name.trim()) return alert("Nombre de mesa requerido");
    const priceNum = Number(newTable.price) || 0;
    const capacityNum = Number(newTable.capacity) || 4;

    setSubmittingTable(true);
    try {
      const { data, error } = await supabase
        .from("event_tables")
        .insert({
          event_id: selectedEventId,
          name: newTable.name.trim(),
          price: priceNum,
          capacity: capacityNum,
          description: newTable.description.trim() || null,
          image_url: newTable.image_url.trim() || null,
          status: newTable.status
        })
        .select()
        .single();

      if (error) throw error;
      setTables(prev => [...prev, data]);
      setNewTable({
        name: "",
        price: "",
        capacity: "",
        description: "",
        image_url: "",
        status: "active"
      });
      setSuccessMsg("Mesa/Área VIP creada exitosamente.");
    } catch (err: any) {
      alert("Error creando mesa: " + err.message);
    } finally {
      setSubmittingTable(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta mesa?")) return;
    try {
      const { error } = await supabase
        .from("event_tables")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setTables(prev => prev.filter(t => t.id !== id));
      setSuccessMsg("Mesa eliminada con éxito.");
    } catch (err: any) {
      alert("Error eliminando mesa: " + err.message);
    }
  };

  // ----------------------------------------------------
  // REAL-TIME SALES DASHBOARD DATA FETCH
  // ----------------------------------------------------
  const [salesStats, setSalesStats] = useState<any>({
    ticketsSold: 0,
    revenue: 0,
    attendeesCount: 0,
    checkedIn: 0,
    occupancy: 0,
    dailySales: 0,
    dailyRevenue: 0,
    salesByBatch: {}
  });
  const [loadingSales, setLoadingSales] = useState(false);

  useEffect(() => {
    if (!selectedEventId || activeTab !== "sales") return;

    async function loadSalesStats() {
      setLoadingSales(true);
      try {
        // Fetch all bookings for this event
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from("bookings")
          .select("id, total_amount, status, created_at, qr_status, number_of_people")
          .eq("event_id", selectedEventId);

        if (bookingsErr) throw bookingsErr;

        const activeBookings = (bookingsData || []).filter(
          b => b.status === "confirmed" || b.status === "completed"
        );

        const ticketsSold = activeBookings.length;
        const revenue = activeBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
        const attendeesCount = activeBookings.reduce((sum, b) => sum + (b.number_of_people || 1), 0);
        const checkedIn = activeBookings.filter(b => b.qr_status === "used").length;

        // Daily sales (past 24h)
        const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dailySales = activeBookings.filter(b => new Date(b.created_at) > past24h).length;
        const dailyRevenue = activeBookings
          .filter(b => new Date(b.created_at) > past24h)
          .reduce((sum, b) => sum + Number(b.total_amount), 0);

        // Occupancy in percent (total attendees / event capacity)
        const totalCapacity = selectedEvent?.ticket_price ? 350 : 200; // rough capacity fallback
        const occupancy = totalCapacity > 0 ? Math.min(Math.round((attendeesCount / totalCapacity) * 100), 100) : 0;

        setSalesStats({
          ticketsSold,
          revenue,
          attendeesCount,
          checkedIn,
          occupancy,
          dailySales,
          dailyRevenue
        });

      } catch (err) {
        console.error("Error loading sales dashboard:", err);
      } finally {
        setLoadingSales(false);
      }
    }

    loadSalesStats();
  }, [selectedEventId, activeTab, selectedEvent]);

  if (events.length === 0) {
    return (
      <div className="glass-card p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
        <p className="font-bold text-white">No tienes eventos creados</p>
        <p className="text-xs text-zinc-550">Debes crear al menos un evento para poder configurar la boletería.</p>
        <div className="pt-2">
          <Link href="/dashboard/provider/new-event" className="inline-block bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-xs font-bold font-outfit transition-colors">
            Crear mi primer evento
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Selector bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-zinc-950/40 border border-white/5 p-4 rounded-2xl">
        <label className="block min-w-0 flex-grow max-w-md">
          <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider block mb-1">Selecciona el evento a administrar:</span>
          <select 
            value={selectedEventId} 
            onChange={(e) => setSelectedEventId(e.target.value)} 
            className="w-full bg-black/60 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-primary-500/50"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id} className="bg-zinc-950 text-white">
                {evt.title} ({new Date(evt.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})
              </option>
            ))}
          </select>
        </label>
        
        {/* Navigation Tabs inside Ticketing Manager */}
        <div className="flex p-1 bg-black/40 rounded-xl border border-white/6 self-end sm:self-center">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "settings" ? "bg-primary-600 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            ⚙️ Ajustes
          </button>
          <button
            onClick={() => setActiveTab("batches")}
            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "batches" ? "bg-primary-600 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            🎟️ Lotes
          </button>
          <button
            onClick={() => setActiveTab("tables")}
            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "tables" ? "bg-primary-600 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            🛋️ Mesas
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "sales" ? "bg-primary-600 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            📊 Ventas
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-xs">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-450 hover:text-white">✕</button>
        </div>
      )}

      {/* TAB CONTENTS */}
      <div className="mt-4">
        {loadingSettings ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
        ) : (
          <AnimatePresence mode="wait">
            {/* TAB 1: SETTINGS / AJUSTES */}
            {activeTab === "settings" && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">Tipo de Evento & Estilo de Boletería</h3>
                    <p className="text-[10px] text-zinc-500 uppercase mt-0.5">Controla cómo se venden los accesos y la privacidad de la boletería</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Event Type & Ticketing Toggle */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                        <input
                          id="ticketing-enabled"
                          type="checkbox"
                          checked={settings.ticketing_enabled}
                          onChange={(e) => setSettings({ ...settings, ticketing_enabled: e.target.checked })}
                          className="w-4 h-4 accent-primary-500 cursor-pointer"
                        />
                        <label htmlFor="ticketing-enabled" className="text-xs font-bold text-zinc-200 cursor-pointer select-none">
                          Habilitar Boletería / Venta de Accesos
                        </label>
                      </div>

                      {settings.ticketing_enabled && (
                        <label className="block">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Estrategia de Accesos (Tipo de Evento)</span>
                          <select 
                            value={settings.event_type}
                            onChange={(e) => setSettings({ ...settings, event_type: e.target.value })}
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-3.5 py-2.5 text-xs text-white"
                          >
                            <option value="free">Evento Gratuito (Registro Libre)</option>
                            <option value="tickets">Venta de Entradas (Batches / Tiers)</option>
                            <option value="tables">Reserva de Mesa (Consumo Mínimo / VIP)</option>
                            <option value="tickets_and_tables">Entrada + Mesa (Boleto y Mesa VIP)</option>
                            <option value="private">Evento Privado (Acceso con Código)</option>
                            <option value="guestlist">Lista de Invitados (Validación QR Manual)</option>
                          </select>
                        </label>
                      )}

                      <label className="block">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Privacidad de Asistentes</span>
                        <select 
                          value={settings.show_attendees}
                          onChange={(e) => setSettings({ ...settings, show_attendees: e.target.value })}
                          className="w-full bg-black/40 border border-white/8 rounded-xl px-3.5 py-2.5 text-xs text-white"
                        >
                          <option value="all">Mostrar asistentes y sus perfiles públicamente</option>
                          <option value="count_only">Mostrar únicamente la cantidad total de asistentes</option>
                          <option value="hidden">Ocultar completamente los asistentes (Privado)</option>
                        </select>
                      </label>
                    </div>

                    {/* Ticket Card Text Customization */}
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Título de Tarjeta de Compra</span>
                        <input
                          type="text"
                          value={settings.ticket_card_title}
                          onChange={(e) => setSettings({ ...settings, ticket_card_title: e.target.value })}
                          placeholder="Ej. Adquiere tus accesos"
                          className="w-full bg-black/40 border border-white/8 rounded-xl px-3.5 py-2.5 text-xs text-white"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Descripción de Tarjeta de Compra</span>
                        <textarea
                          rows={2}
                          value={settings.ticket_card_description}
                          onChange={(e) => setSettings({ ...settings, ticket_card_description: e.target.value })}
                          placeholder="Texto de confianza..."
                          className="w-full bg-black/40 border border-white/8 rounded-xl px-3.5 py-2.5 text-xs text-white"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Modules toggles Grid */}
                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Módulos Visibles en la Página Pública</h4>
                      <p className="text-[9px] text-zinc-550 uppercase">Activa o desactiva qué secciones se renderizan públicamente</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { key: "show_sales_progress", label: "📈 Mostrar porcentaje vendido" },
                        { key: "show_capacity", label: "👥 Mostrar aforo total" },
                        { key: "show_favorites", label: "❤️ Mostrar favoritos" },
                        { key: "show_countdown", label: "⏳ Mostrar regresivo" },
                        { key: "show_remaining_tickets", label: "🎟️ Mostrar entradas restantes" },
                        { key: "show_statistics", label: "📊 Mostrar estadísticas de vistas" },
                        { key: "show_who_is_going", label: "👥 Mostrar quién va (Avatares)" },
                        { key: "show_event_chat", label: "💬 Mostrar chat del evento" },
                        { key: "show_event_community", label: "🌐 Mostrar comunidad (Connect)" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.005] border border-white/[0.03] hover:border-white/5 transition-colors">
                          <input
                            id={`toggle-${item.key}`}
                            type="checkbox"
                            checked={settings[item.key]}
                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                            className="w-3.5 h-3.5 accent-primary-500 cursor-pointer"
                          />
                          <label htmlFor={`toggle-${item.key}`} className="text-[11px] font-semibold text-zinc-300 cursor-pointer select-none">
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary-600/10"
                    >
                      {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Guardar Configuración
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: TIER BATCHES / LOTES */}
            {activeTab === "batches" && (
              <motion.div
                key="batches-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-6">
                  {/* Create Batch Form */}
                  <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 space-y-4 self-start">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">Crear Lote de Entradas</h3>
                      <p className="text-[10px] text-zinc-500 uppercase">Crea preventas, generales, pases VIP, etc.</p>
                    </div>

                    <form onSubmit={handleCreateBatch} className="space-y-3.5">
                      <label className="block">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Nombre del Lote *</span>
                        <input
                          type="text"
                          required
                          value={newBatch.name}
                          onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                          placeholder="ej: Preventa Early Bird, General..."
                          className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Descripción</span>
                        <input
                          type="text"
                          value={newBatch.description}
                          onChange={(e) => setNewBatch({ ...newBatch, description: e.target.value })}
                          placeholder="ej: Acceso prioritario, Incluye souvenir..."
                          className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Precio COP *</span>
                          <input
                            type="number"
                            required
                            value={newBatch.price}
                            onChange={(e) => setNewBatch({ ...newBatch, price: e.target.value })}
                            placeholder="45000"
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Capacidad (Cupos) *</span>
                          <input
                            type="number"
                            required
                            value={newBatch.capacity}
                            onChange={(e) => setNewBatch({ ...newBatch, capacity: e.target.value })}
                            placeholder="150"
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Color Identificador</span>
                          <select
                            value={newBatch.color_code}
                            onChange={(e) => setNewBatch({ ...newBatch, color_code: e.target.value })}
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                          >
                            <option value="#9333ea">Violeta (Premium)</option>
                            <option value="#3b82f6">Azul (General)</option>
                            <option value="#10b981">Verde (Early Bird)</option>
                            <option value="#f59e0b">Dorado / VIP</option>
                            <option value="#f43f5e">Rosa / Backstage</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Estado Inicial</span>
                          <select
                            value={newBatch.status}
                            onChange={(e) => setNewBatch({ ...newBatch, status: e.target.value })}
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                          >
                            <option value="active">Activo (Visible y en venta)</option>
                            <option value="inactive">Inactivo (Oculto)</option>
                            <option value="locked">Bloqueado (No vendible aún)</option>
                            <option value="sold_out">Agotado</option>
                          </select>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingBatch}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {submittingBatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Crear Lote
                      </button>
                    </form>
                  </div>

                  {/* List of existing batches */}
                  <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">Lotes Existentes ({batches.length})</h3>
                    {batches.length === 0 ? (
                      <p className="text-xs text-zinc-550 text-center py-12">No hay lotes creados para este evento.</p>
                    ) : (
                      <div className="space-y-3">
                        {batches.map((batch) => (
                          <div 
                            key={batch.id} 
                            className="flex items-center justify-between p-4 bg-black/45 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span 
                                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-lg"
                                style={{ backgroundColor: batch.color_code || "#9333ea" }}
                              />
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-white text-xs leading-snug">{batch.name}</h4>
                                {batch.description && <p className="text-[10px] text-zinc-450 truncate mt-0.5">{batch.description}</p>}
                                <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">
                                  Ventas: {batch.sold_count || 0} / {batch.capacity} • Estado: <span className="capitalize font-bold text-primary-400">{batch.status}</span>
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-black text-emerald-450">${batch.price}</span>
                              <button
                                onClick={() => handleDeleteBatch(batch.id)}
                                className="w-7 h-7 bg-red-650/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                                title="Eliminar Lote"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: TABLES / MESAS */}
            {activeTab === "tables" && (
              <motion.div
                key="tables-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-6">
                  {/* Create Table Form */}
                  <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 space-y-4 self-start">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">Agregar Mesa / Lounge VIP</h3>
                      <p className="text-[10px] text-zinc-500 uppercase">Crea palcos, lounges o mesas con consumo</p>
                    </div>

                    <form onSubmit={handleCreateTable} className="space-y-3.5">
                      <label className="block">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Nombre del Área / Mesa *</span>
                        <input
                          type="text"
                          required
                          value={newTable.name}
                          onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                          placeholder="ej: Palco VIP Diamante, Mesa Lounge 1..."
                          className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Descripción / Qué incluye</span>
                        <input
                          type="text"
                          value={newTable.description}
                          onChange={(e) => setNewTable({ ...newTable, description: e.target.value })}
                          placeholder="ej: Incluye 1 botella premium, Entradas para 6 pers..."
                          className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Precio de Mesa *</span>
                          <input
                            type="number"
                            required
                            value={newTable.price}
                            onChange={(e) => setNewTable({ ...newTable, price: e.target.value })}
                            placeholder="350000"
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Capacidad (Pers.) *</span>
                          <input
                            type="number"
                            required
                            value={newTable.capacity}
                            onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                            placeholder="6"
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Flyer / Imagen URL</span>
                          <input
                            type="text"
                            value={newTable.image_url}
                            onChange={(e) => setNewTable({ ...newTable, image_url: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Estado Inicial</span>
                          <select
                            value={newTable.status}
                            onChange={(e) => setNewTable({ ...newTable, status: e.target.value })}
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white"
                          >
                            <option value="active">Activo (Disponible)</option>
                            <option value="inactive">Inactivo (No disponible)</option>
                            <option value="sold_out">Reservado / Agotado</option>
                          </select>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingTable}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {submittingTable ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Agregar Mesa
                      </button>
                    </form>
                  </div>

                  {/* List of existing tables */}
                  <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">Mesas y Áreas VIP ({tables.length})</h3>
                    {tables.length === 0 ? (
                      <p className="text-xs text-zinc-550 text-center py-12">No hay mesas o palcos configurados para este evento.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tables.map((tbl) => (
                          <div 
                            key={tbl.id} 
                            className="flex flex-col justify-between p-4 bg-black/45 rounded-xl border border-white/5 hover:border-white/10 transition-all space-y-3"
                          >
                            <div className="flex items-start gap-3">
                              {tbl.image_url ? (
                                <img src={tbl.image_url} alt="mesa" className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-550 shrink-0 font-bold">🛋️</div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-white text-xs leading-snug">{tbl.name}</h4>
                                <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">Capacidad: {tbl.capacity} personas</p>
                                {tbl.description && <p className="text-[9px] text-zinc-400 mt-1 line-clamp-1 leading-snug">{tbl.description}</p>}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                              <span className="text-emerald-450 font-bold">${tbl.price} COP</span>
                              <div className="flex gap-2">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                  tbl.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {tbl.status === 'active' ? 'Disponible' : 'Agotado'}
                                </span>
                                <button
                                  onClick={() => handleDeleteTable(tbl.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: REAL-TIME SALES DASHBOARD */}
            {activeTab === "sales" && (
              <motion.div
                key="sales-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {loadingSales ? (
                  <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                ) : (
                  <div className="space-y-6">
                    {/* Sales Metrics Cards Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="glass-card p-5 bg-zinc-950/40 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span className="text-[10px] uppercase font-bold tracking-wider">Entradas Vendidas</span>
                          <Ticket className="w-4 h-4 text-primary-400" />
                        </div>
                        <p className="text-2xl font-black text-white font-outfit">{salesStats.ticketsSold}</p>
                        <p className="text-[9px] text-zinc-550">Compras exitosas confirmadas</p>
                      </div>

                      <div className="glass-card p-5 bg-zinc-950/40 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span className="text-[10px] uppercase font-bold tracking-wider">Ingresos Generados</span>
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-2xl font-black text-white font-outfit">${salesStats.revenue.toLocaleString("es-CO")} COP</p>
                        <p className="text-[9px] text-zinc-550">Monto total recaudado neto</p>
                      </div>

                      <div className="glass-card p-5 bg-zinc-950/40 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span className="text-[10px] uppercase font-bold tracking-wider">Asistentes Reales</span>
                          <Users className="w-4 h-4 text-indigo-400" />
                        </div>
                        <p className="text-2xl font-black text-white font-outfit">{salesStats.attendeesCount}</p>
                        <p className="text-[9px] text-zinc-550">Total de personas registradas</p>
                      </div>

                      <div className="glass-card p-5 bg-zinc-950/40 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span className="text-[10px] uppercase font-bold tracking-wider">Accesos Validados</span>
                          <QrCode className="w-4 h-4 text-violet-400" />
                        </div>
                        <p className="text-2xl font-black text-white font-outfit">{salesStats.checkedIn}</p>
                        <p className="text-[9px] text-zinc-550">Códigos QR escaneados en puerta</p>
                      </div>
                    </div>

                    {/* Secondary Analytics Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 space-y-4">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Actividad del Día (24 Horas)</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Ventas de hoy</span>
                            <span className="text-xl font-black text-white font-outfit mt-1 block">{salesStats.dailySales} tickets</span>
                          </div>
                          <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Ingresos de hoy</span>
                            <span className="text-xl font-black text-emerald-450 font-outfit mt-1 block">${salesStats.dailyRevenue.toLocaleString("es-CO")} COP</span>
                          </div>
                        </div>
                      </div>

                      <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 space-y-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Aforo y Ocupación Estimada</h3>
                          <p className="text-[9px] text-zinc-500 uppercase mt-0.5">Calculada según aforo base</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400 font-bold uppercase tracking-wider">{salesStats.occupancy}% Ocupado</span>
                            <span className="text-primary-400 font-black">{salesStats.attendeesCount} / 350 Personas</span>
                          </div>
                          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 transition-all duration-500"
                              style={{ width: `${salesStats.occupancy}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
