'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ClubBookingState = {
  success?: boolean
  error?: string
  message?: string
}

function parseGuestCount(value: FormDataEntryValue | null) {
  if (!value) return 0

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0

  return Math.max(1, Math.floor(parsed))
}

function buildBookingNotes(customerName: string, guestCount: number, comment: string) {
  const parts = [`Cliente: ${customerName}`, `Personas: ${guestCount}`]

  if (comment.trim()) {
    parts.push(`Comentario: ${comment.trim()}`)
  }

  return parts.join(' | ')
}

type ClubBookingPayload = {
  user_id: string
  provider_id: string
  club_id: string
  club_slug: string
  reservation_date: string
  event_date: string
  event_time: string
  number_of_people: number
  total_amount: number
  notes: string
  status: 'pending'
}

async function ensureUserProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (profile) {
    return
  }

  const fallbackName = `Cliente ${Math.random().toString(36).substring(2, 7)}`

  const { error } = await supabase.from('profiles').insert({
    id: userId,
    role: 'user',
    full_name: fallbackName,
    username: fallbackName.toLowerCase().replace(/\s+/g, '_'),
    city: 'No especificada',
    bio: null,
    avatar_url: null,
    phone: null,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function createClubReservation(_: ClubBookingState, formData: FormData): Promise<ClubBookingState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Debes iniciar sesión para reservar una mesa VIP o entradas.' }
  }

  const clubId = String(formData.get('clubId') || '')
  const customerName = String(formData.get('customer_name') || '').trim()
  const reservationDate = String(formData.get('reservation_date') || '').trim()
  const guestCount = parseGuestCount(formData.get('guest_count'))
  const comment = String(formData.get('comment') || '').trim()

  if (!clubId) {
    return { error: 'No se encontró la discoteca seleccionada.' }
  }

  if (!customerName) {
    return { error: 'El nombre del cliente es obligatorio.' }
  }

  if (!reservationDate) {
    return { error: 'La fecha de reserva es obligatoria.' }
  }

  if (!guestCount || guestCount < 1) {
    return { error: 'La cantidad de personas debe ser al menos 1.' }
  }

  const reservationDateObj = new Date(`${reservationDate}T00:00:00`)

  if (Number.isNaN(reservationDateObj.getTime())) {
    return { error: 'La fecha ingresada no es válida.' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (reservationDateObj.getTime() < today.getTime()) {
    return { error: 'La fecha de reserva no puede ser anterior a hoy.' }
  }

  try {
    await ensureUserProfile(supabase, user.id)

    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, slug, provider_id')
      .eq('id', clubId)
      .single()

    if (clubError || !club) {
      return { error: 'No se pudo cargar la discoteca para crear la reserva.' }
    }

    if (!club.provider_id) {
      return { error: 'Esta discoteca aún no tiene un proveedor asignado para gestionar reservas.' }
    }

    const totalAmount = Number((guestCount * 100).toFixed(2))
    const notes = buildBookingNotes(customerName, guestCount, comment)

    const bookingPayload: ClubBookingPayload = {
      user_id: user.id,
      provider_id: club.provider_id,
      club_id: club.id,
      club_slug: club.slug || '',
      reservation_date: reservationDate,
      event_date: reservationDate,
      event_time: '00:00:00',
      number_of_people: guestCount,
      total_amount: totalAmount,
      notes,
      status: 'pending',
    }

    const { error: bookingError } = await supabase.from('bookings').insert(bookingPayload)

    if (bookingError) {
      return { error: `No se pudo guardar la reserva: ${bookingError.message}` }
    }

    revalidatePath('/dashboard/user')
    revalidatePath('/dashboard/provider')
    revalidatePath('/discotecas')

    return {
      success: true,
      message: `Reserva creada correctamente para ${customerName}. El proveedor revisará tu solicitud pronto.`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.'

    if (/row-level security|permission denied|new row violates row-level security/i.test(message)) {
      return {
        error:
          'La reserva no pudo insertarse por RLS o permisos. Revisa que el script de integración haya aplicado las columnas y políticas correctas.',
      }
    }

    return { error: message }
  }
}
