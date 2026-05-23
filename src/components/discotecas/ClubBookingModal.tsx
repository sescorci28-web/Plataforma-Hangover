'use client'

import { useActionState, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, LogIn, ShieldCheck, Sparkles, Ticket, Users, X } from 'lucide-react'
import { createClubReservation, type ClubBookingState } from '@/app/discotecas/[slug]/actions'

interface ClubBookingModalProps {
  club: {
    id: string
    name: string
    provider_id: string | null
  }
  isAuthenticated: boolean
  defaultClientName: string
}

const initialState: ClubBookingState = {}

export function ClubBookingModal({ club, isAuthenticated, defaultClientName }: ClubBookingModalProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createClubReservation, initialState)

  const canBook = isAuthenticated && Boolean(club.provider_id)

  const subtitle = useMemo(() => {
    if (!isAuthenticated) {
      return 'Inicia sesión para reservar una mesa VIP o entradas en esta discoteca.'
    }

    if (!club.provider_id) {
      return 'Esta discoteca no tiene un proveedor asignado para gestionar reservas aún.'
    }

    return 'Completa el formulario premium y confirma tu reserva con un proveedor verificado.'
  }, [club.provider_id, isAuthenticated])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canBook}
        className={`w-full inline-flex justify-center items-center gap-2 rounded-xl py-3 px-4 font-semibold text-sm transition-all ${
          canBook
            ? 'bg-primary-600 hover:bg-primary-500 text-white glow cursor-pointer'
            : 'bg-white/5 text-zinc-400 border border-white/5 cursor-not-allowed'
        }`}
      >
        <Ticket className="w-4 h-4" />
        {canBook ? 'Reservar Mesa VIP / Entradas' : 'Reserva no disponible'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative z-10 w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#09090f]/95 p-6 shadow-[0_20px_80px_rgba(34,211,238,0.15)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-primary-300">Reserva Premium</p>
                <h2 className="mt-2 text-2xl font-bold text-white">{club.name}</h2>
                <p className="mt-2 text-sm text-zinc-300">{subtitle}</p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr,0.9fr]">
              <div className="rounded-2xl border border-primary-500/20 bg-primary-500/10 p-4">
                <div className="flex items-center gap-2 text-primary-300">
                  <Sparkles className="w-4 h-4" />
                  <p className="text-sm font-semibold">Experiencia Hangover</p>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-zinc-200">
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-300 mt-0.5" />
                    <span>Confirmación inmediata y seguimiento del proveedor.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-accent-300 mt-0.5" />
                    <span>Reserva para mesas VIP, entradas o grupos premium.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-primary-300 mt-0.5" />
                    <span>Personaliza la fecha, tamaño del grupo y comentarios.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-300">Necesitas una sesión activa para confirmar tu reserva.</p>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500"
                    >
                      <LogIn className="w-4 h-4" />
                      Iniciar sesión
                    </Link>
                  </div>
                ) : !club.provider_id ? (
                  <p className="text-sm text-zinc-300">Esta discoteca aún no tiene un proveedor asignado. Intenta con otra discoteca o contacta al equipo Hangover.</p>
                ) : (
                  <form action={formAction} className="space-y-4">
                    <input type="hidden" name="clubId" value={club.id} />

                    <label className="block text-sm text-zinc-200">
                      <span className="mb-1 block font-medium">Nombre del cliente</span>
                      <input
                        name="customer_name"
                        defaultValue={defaultClientName}
                        required
                        placeholder="Tu nombre"
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none transition focus:border-primary-400"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm text-zinc-200">
                        <span className="mb-1 block font-medium">Fecha de reserva</span>
                        <input
                          name="reservation_date"
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none transition focus:border-primary-400"
                        />
                      </label>

                      <label className="block text-sm text-zinc-200">
                        <span className="mb-1 block font-medium">Cantidad de personas</span>
                        <input
                          name="guest_count"
                          type="number"
                          min={1}
                          max={100}
                          defaultValue={2}
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none transition focus:border-primary-400"
                        />
                      </label>
                    </div>

                    <label className="block text-sm text-zinc-200">
                      <span className="mb-1 block font-medium">Comentario opcional</span>
                      <textarea
                        name="comment"
                        rows={4}
                        placeholder="Prefiere mesa, botella, pista, música, etc."
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none transition focus:border-primary-400"
                      />
                    </label>

                    <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-zinc-300">
                      <p className="font-semibold text-white">Reserva en estado pendiente</p>
                      <p className="mt-1">El proveedor recibirá la solicitud y la confirmará o ajustará los detalles.</p>
                    </div>

                    {state.error && (
                      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {state.error}
                      </p>
                    )}

                    {state.success && (
                      <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                        {state.message}
                      </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-white/20"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isPending ? 'Procesando...' : 'Confirmar reserva'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
