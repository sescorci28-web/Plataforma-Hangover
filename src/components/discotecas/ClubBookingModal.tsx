'use client'

import { useActionState, useMemo } from 'react'
import Link from 'next/link'
import { CalendarDays, LogIn, ShieldCheck, Sparkles, Ticket, Users } from 'lucide-react'
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
    <div className="glass-card w-full rounded-[28px] border border-white/10 bg-[#09090f]/85 p-5 md:p-6 shadow-[0_20px_80px_rgba(34,211,238,0.12)] lg:max-w-md lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary-300">
            <Sparkles className="w-3 h-3" />
            Reserva premium
          </div>
          <div>
            <p className="text-sm text-zinc-300">{subtitle}</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-primary-500/20 bg-primary-500/10 p-4">
          <div className="flex items-center gap-2 text-primary-200">
            <ShieldCheck className="w-4 h-4" />
            <p className="text-sm font-semibold">Experiencia Hangover</p>
          </div>
          <ul className="mt-3 space-y-3 text-sm text-zinc-100">
            <li className="flex items-start gap-2">
              <Users className="w-4 h-4 text-accent-300 mt-0.5" />
              <span>Reserva mesas VIP, entradas o grupos premium con un proveedor verificado.</span>
            </li>
            <li className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-primary-300 mt-0.5" />
              <span>Personaliza la fecha, la cantidad de personas y los detalles de la noche.</span>
            </li>
            <li className="flex items-start gap-2">
              <Ticket className="w-4 h-4 text-emerald-300 mt-0.5" />
              <span>Tu solicitud queda registrada como pendiente para revisión del proveedor.</span>
            </li>
          </ul>
        </div>

        {canBook ? (
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
                <span className="mb-1 block font-medium">Personas</span>
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
                placeholder="Mesa cerca del DJ, botella, pista, accesos, etc."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none transition focus:border-primary-400"
              />
            </label>

            <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-zinc-300">
              <p className="font-semibold text-white">Reserva en estado pendiente</p>
              <p className="mt-1">El proveedor recibirá tu solicitud y la confirmará o ajustará los detalles.</p>
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

            <button
              type="submit"
              disabled={isPending}
              className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Ticket className="w-4 h-4" />
              {isPending ? 'Procesando...' : 'Reservar Mesa VIP / Entradas'}
            </button>
          </form>
        ) : !isAuthenticated ? (
          <div className="space-y-3 rounded-[24px] border border-white/10 bg-black/35 p-4">
            <p className="text-sm text-zinc-300">Necesitas una sesión activa para confirmar tu reserva.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500"
            >
              <LogIn className="w-4 h-4" />
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <div className="rounded-[24px] border border-white/10 bg-black/35 p-4 text-sm text-zinc-300">
            Esta discoteca aún no tiene un proveedor asignado para gestionar reservas.
          </div>
        )}
      </div>
    </div>
  )
}
