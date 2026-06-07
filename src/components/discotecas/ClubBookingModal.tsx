'use client'

import { useState, useActionState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { CalendarDays, LogIn, ShieldCheck, Sparkles, Ticket, Users, Wine } from 'lucide-react'
import { createClubReservation, buyClubCover, type ClubBookingState } from '@/app/discotecas/[slug]/actions'

interface MenuItem {
  id: string
  category: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  featured: boolean
  available: boolean
}

interface ClubTable {
  id: string
  table_number: string
  zone: string | null
  status: string
  active: boolean
}

interface ClubBookingModalProps {
  club: {
    id: string
    name: string
    provider_id: string | null
    cover_price?: number
  }
  isAuthenticated: boolean
  defaultClientName: string
  menuItems?: MenuItem[]
  clubTables?: ClubTable[]
}

const initialState: ClubBookingState = {}

export function ClubBookingModal({
  club,
  isAuthenticated,
  defaultClientName,
  menuItems = [],
  clubTables = []
}: ClubBookingModalProps) {
  const [activeTab, setActiveTab] = useState<'vip' | 'cover' | 'bottle'>('vip')
  const [coverName, setCoverName] = useState(defaultClientName ?? '')
  const [coverDate, setCoverDate] = useState('')
  const [coverGuests, setCoverGuests] = useState(1)

  // Bottle selection states
  const [selectedBottleId, setSelectedBottleId] = useState('')
  const [bottleComment, setBottleComment] = useState('')

  // Table selection states
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>('')

  const [state, formAction, isPending] = useActionState(createClubReservation, initialState)
  const [coverState, coverFormAction, isCoverPending] = useActionState(buyClubCover, initialState)

  const coverPrice = club.cover_price ?? 0.00
  const canBook = isAuthenticated && Boolean(club.provider_id)

  const bottleItems = useMemo(() => {
    return (menuItems || []).filter(item => 
      item.available &&
      ["Whisky", "Vodka", "Ron", "Tequila", "Cerveza", "Cócteles", "Combos"].includes(item.category)
    )
  }, [menuItems])

  const computedBottleComment = useMemo(() => {
    const selectedBottle = bottleItems.find(b => b.id === selectedBottleId)
    if (selectedBottle) {
      return `[Reserva de Botella: ${selectedBottle.name}] ${bottleComment}`.trim()
    }
    return bottleComment
  }, [selectedBottleId, bottleComment, bottleItems])

  // Group tables by category/zone dynamically
  const tablesByZone = useMemo(() => {
    const groups: Record<string, ClubTable[]> = {}
    if (!clubTables || clubTables.length === 0) return groups
    
    clubTables.forEach(table => {
      const zoneName = table.zone || 'General'
      if (!groups[zoneName]) {
        groups[zoneName] = []
      }
      groups[zoneName].push(table)
    })
    return groups
  }, [clubTables])

  const zones = useMemo(() => Object.keys(tablesByZone), [tablesByZone])

  // Set first zone as default
  useEffect(() => {
    if (zones.length > 0 && !selectedZone) {
      setSelectedZone(zones[0])
    }
  }, [zones, selectedZone])

  const subtitle = useMemo(() => {
    if (!isAuthenticated) {
      return activeTab === 'vip'
        ? 'Inicia sesión para reservar una mesa en esta discoteca.'
        : activeTab === 'cover'
        ? 'Inicia sesión para comprar un cover de entrada.'
        : 'Inicia sesión para reservar botellas y asegurar tu consumo.'
    }

    if (!club.provider_id) {
      return 'Esta discoteca no tiene un proveedor asignado para gestionar reservas aún.'
    }

    if (activeTab === 'vip') {
      return 'Completa el formulario y selecciona la mesa de tu preferencia para tu grupo.'
    } else if (activeTab === 'cover') {
      return `Compra tus entradas al instante por $${Math.round(coverPrice).toLocaleString('es-CO')} COP c/u.`
    } else {
      return 'Reserva botellas y combos directamente de la carta para asegurar consumo en tu mesa.'
    }
  }, [club.provider_id, isAuthenticated, activeTab, coverPrice])

  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        {/* Compact subtitle and verification badge */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400 font-medium leading-relaxed max-w-xl">{subtitle}</p>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-zinc-300 font-semibold tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-400" />
            <span>Reserva Segura Connect</span>
          </div>
        </div>

        {canBook && (
          <div className="flex border-b border-white/5 pb-px gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('vip')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 border-b-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'vip'
                  ? 'border-primary-500 text-white bg-primary-500/5'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              <span>Reserva de Mesa</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cover')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 border-b-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'cover'
                  ? 'border-primary-500 text-white bg-primary-500/5'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-accent-400" />
              <span>Cover</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bottle')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 border-b-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'bottle'
                  ? 'border-primary-500 text-white bg-primary-500/5'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Wine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Botellas</span>
            </button>
          </div>
        )}

        {canBook ? (
          activeTab === 'vip' ? (
            <form key="vip-booking-form" action={formAction} className="space-y-5">
              <input key="vip-club-id" type="hidden" name="clubId" value={club.id ?? ''} />
              <input type="hidden" name="table_zone" value={selectedZone} />
              <input type="hidden" name="table_number" value={selectedTableNumber} />

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs text-zinc-300">
                  <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Nombre del cliente</span>
                  <input
                    key="vip-customer-name"
                    name="customer_name"
                    defaultValue={defaultClientName ?? ''}
                    required
                    placeholder="Tu nombre"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                  />
                </label>

                <label className="block text-xs text-zinc-300">
                  <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Fecha de reserva</span>
                  <input
                    key="vip-reservation-date"
                    name="reservation_date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                  />
                </label>

                <label className="block text-xs text-zinc-300">
                  <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Personas</span>
                  <input
                    key="vip-guest-count"
                    name="guest_count"
                    type="number"
                    min={1}
                    max={100}
                    defaultValue={2}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                  />
                </label>
              </div>

              {/* Dynamic Categories & Interactive Tables Section */}
              {zones.length > 0 ? (
                <div className="space-y-4 rounded-2xl border border-white/5 bg-zinc-950/40 p-4.5">
                  <div className="space-y-2">
                    <span className="block text-[11px] font-black uppercase tracking-wider text-zinc-400">
                      1. Selecciona Categoría / Zona
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {zones.map((zone) => (
                        <button
                          key={zone}
                          type="button"
                          onClick={() => {
                            setSelectedZone(zone)
                            setSelectedTableNumber('') // reset selected table on zone change
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                            selectedZone === zone
                              ? 'bg-gradient-to-r from-primary-600 to-accent-600 border-primary-500 text-white shadow-md shadow-primary-500/15'
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
                          }`}
                        >
                          {zone}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedZone && tablesByZone[selectedZone] && (
                    <div className="space-y-2.5 pt-2 border-t border-white/5">
                      <span className="block text-[11px] font-black uppercase tracking-wider text-zinc-400">
                        2. Selecciona tu Mesa (Zona: {selectedZone})
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {tablesByZone[selectedZone].map((table) => {
                          const isReserved = table.status === 'Reservada'
                          const isSelected = selectedTableNumber === table.table_number
                          
                          return (
                            <button
                              key={table.id}
                              type="button"
                              disabled={isReserved}
                              onClick={() => setSelectedTableNumber(table.table_number)}
                              className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border relative ${
                                isReserved
                                  ? 'bg-zinc-950 border-zinc-900/50 text-zinc-600 cursor-not-allowed opacity-40'
                                  : isSelected
                                  ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-md shadow-emerald-500/20 font-black'
                                  : 'bg-black/50 border-white/10 text-zinc-300 hover:border-white/25'
                              }`}
                            >
                              <span className="text-xs font-black font-outfit">{table.table_number}</span>
                              <span className={`text-[8px] font-bold ${isReserved ? 'text-red-400' : isSelected ? 'text-emerald-100' : 'text-zinc-500'}`}>
                                {isReserved ? 'Reservada' : 'Disponible'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {selectedTableNumber && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-between text-xs transition-all animate-fade-in">
                      <span className="font-semibold text-emerald-400">Mesa seleccionada:</span>
                      <span className="font-black text-white bg-emerald-600 px-3 py-1 rounded-lg">
                        {selectedZone} — Mesa {selectedTableNumber}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 border border-white/5 bg-zinc-950/20 rounded-xl">
                  <p className="text-xs text-zinc-500">
                    No hay mesas específicas configuradas por la discoteca. Puedes solicitar tu reserva general a continuación.
                  </p>
                </div>
              )}

              <label className="block text-xs text-zinc-300">
                <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Comentario opcional o requerimientos</span>
                <textarea
                  name="comment"
                  rows={3}
                  placeholder="Mesa cerca de la pista, botella específica, accesos especiales, etc."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                />
              </label>

              <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-xs text-zinc-400 leading-relaxed">
                <span className="font-semibold text-white block mb-0.5">Reserva en estado pendiente</span>
                La solicitud será evaluada por el proveedor. Al confirmarse la mesa, se te notificará directamente por la plataforma.
              </div>

              {state.error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
                  {state.error}
                </p>
              )}

              {state.success && (
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-100">
                  {state.message}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white py-3.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-75 shadow-lg shadow-primary-500/10 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                {isPending ? 'Procesando Reserva...' : 'Reservar de Mesa'}
              </button>
            </form>
          ) : activeTab === 'cover' ? (
            <form key="cover-booking-form" action={coverFormAction} className="space-y-4">
              <input key="cover-club-id" type="hidden" name="clubId" value={club.id ?? ''} />

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs text-zinc-300">
                  <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Nombre del cliente</span>
                  <input
                    key="cover-customer-name"
                    name="customer_name"
                    value={coverName ?? ''}
                    onChange={(e) => setCoverName(e.target.value)}
                    required
                    placeholder="Tu nombre"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                  />
                </label>

                <label className="block text-xs text-zinc-300">
                  <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Fecha de visita</span>
                  <input
                    key="cover-reservation-date"
                    name="reservation_date"
                    type="date"
                    value={coverDate ?? ''}
                    onChange={(e) => setCoverDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                  />
                </label>

                <label className="block text-xs text-zinc-300">
                  <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Entradas</span>
                  <input
                    key="cover-guest-count"
                    name="guest_count"
                    type="number"
                    min={1}
                    max={50}
                    value={coverGuests ?? 1}
                    onChange={(e) => setCoverGuests(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span>Precio unitario:</span>
                  <span className="font-semibold text-white">${Math.round(coverPrice).toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5 font-bold text-white">
                  <span>Total a pagar:</span>
                  <span className="text-emerald-400 text-base">${Math.round(coverGuests * coverPrice).toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-zinc-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Entrada digital con QR inmediata</p>
                  <p className="mt-0.5 text-zinc-500">Tu entrada se confirmará inmediatamente y se generará tu QR de acceso en el panel.</p>
                </div>
              </div>

              {coverState.error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
                  {coverState.error}
                </p>
              )}

              {coverState.success && (
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-100">
                  {coverState.message}
                </p>
              )}

              <button
                type="submit"
                disabled={isCoverPending}
                className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-accent-600 hover:bg-accent-500 text-white py-3.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-75 glow border border-accent-500/20 cursor-pointer shadow-lg shadow-accent-500/10"
              >
                <Ticket className="w-4 h-4" />
                {isCoverPending ? 'Procesando Compra...' : `Comprar Cover - $${Math.round(coverGuests * coverPrice).toLocaleString('es-CO')} COP`}
              </button>
            </form>
          ) : (
            <form key="bottle-booking-form" action={formAction} className="space-y-4">
              <input key="bottle-club-id" type="hidden" name="clubId" value={club.id ?? ''} />
              <input type="hidden" name="comment" value={computedBottleComment} />

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs text-zinc-300">
                  <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Nombre del cliente</span>
                  <input
                    key="bottle-customer-name"
                    name="customer_name"
                    defaultValue={defaultClientName ?? ''}
                    required
                    placeholder="Tu nombre"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                  />
                </label>

                <label className="block text-xs text-zinc-300">
                  <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Fecha de reserva</span>
                  <input
                    key="bottle-reservation-date"
                    name="reservation_date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                  />
                </label>

                <label className="block text-xs text-zinc-300">
                  <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Personas</span>
                  <input
                    key="bottle-guest-count"
                    name="guest_count"
                    type="number"
                    min={1}
                    max={100}
                    defaultValue={2}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                  />
                </label>
              </div>

              <label className="block text-xs text-zinc-300">
                <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Seleccionar botella / combo</span>
                {bottleItems.length > 0 ? (
                  <select
                    value={selectedBottleId}
                    onChange={(e) => setSelectedBottleId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                  >
                    <option value="" className="bg-zinc-950">Selecciona una botella o combo...</option>
                    {bottleItems.map((item) => (
                      <option key={item.id} value={item.id} className="bg-zinc-950">
                        {item.name} (${item.price.toLocaleString("es-CO")} COP)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-zinc-500 text-xs py-2 bg-black/20 px-3 rounded-xl border border-white/5">
                    No hay botellas o licores cargados en la carta. Puedes detallar lo que deseas en el campo de especificaciones.
                  </div>
                )}
              </label>

              <label className="block text-xs text-zinc-300">
                <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-400">Especificaciones o indicaciones</span>
                <textarea
                  value={bottleComment}
                  onChange={(e) => setBottleComment(e.target.value)}
                  rows={3}
                  placeholder="Hielo adicional, vasos, refrescos específicos o indicaciones para la mesa..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-primary-500 focus:bg-zinc-950"
                />
              </label>

              <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-xs text-zinc-400">
                <span className="font-semibold text-white block mb-0.5">Reserva de botella pendiente</span>
                Confirmaremos la disponibilidad de la mesa y prepararemos tu botella seleccionada para tu llegada.
              </div>

              {state.error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
                  {state.error}
                </p>
              )}

              {state.success && (
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-100">
                  {state.message}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white py-3.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-75 cursor-pointer shadow-lg shadow-primary-500/10"
              >
                <Wine className="w-4 h-4" />
                {isPending ? 'Procesando...' : 'Reservar Botellas'}
              </button>
            </form>
          )
        ) : !isAuthenticated ? (
          <div className="space-y-3.5 rounded-2xl border border-white/5 bg-zinc-950/35 p-5 text-center">
            <p className="text-xs text-zinc-400 leading-relaxed">Necesitas iniciar sesión para realizar reservas o comprar entradas.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-500 cursor-pointer shadow-md shadow-primary-500/10"
            >
              <LogIn className="w-4 h-4" />
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-zinc-950/35 p-5 text-center text-xs text-zinc-400">
            Esta discoteca aún no cuenta con un proveedor verificado para gestionar reservas digitales.
          </div>
        )}
      </div>
    </div>
  )
}
