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

function formatBookingNote(customerName: string, guestCount: number, comment: string) {
  const parts = [`Cliente: ${customerName}`, `Personas: ${guestCount}`]

  if (comment.trim()) {
    parts.push(`Comentario: ${comment.trim()}`)
  }

  return parts.join(' | ')
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

async function getOrCreateClubService(supabase: Awaited<ReturnType<typeof createClient>>, club: { id: string; name: string; provider_id: string }) {
  const { data: existingService } = await supabase
    .from('services')
    .select('id, title')
    .eq('provider_id', club.provider_id)
    .eq('description', `club_reservation:${club.id}`)
    .maybeSingle()

  if (existingService) {
    return existingService
  }

  const { data: insertedService, error: insertError } = await supabase
    .from('services')
    .insert({
      provider_id: club.provider_id,
      title: `${club.name} — Reserva VIP`,
      description: `club_reservation:${club.id}`,
      price: 0,
      category: 'discotecas',
      image_url: null,
    })
    .select('id, title')
    .single()

  if (insertError || !insertedService) {
    throw new Error(insertError?.message || 'No se pudo crear el servicio de reserva para la discoteca.')
  }

  return insertedService
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
      .select('id, name, provider_id')
      .eq('id', clubId)
      .single()

    if (clubError || !club) {
      return { error: 'No se pudo cargar la discoteca para crear la reserva.' }
    }

    if (!club.provider_id) {
      return { error: 'Esta discoteca aún no tiene un proveedor asignado para gestionar reservas.' }
    }

    const service = await getOrCreateClubService(supabase, club)

    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        provider_id: club.provider_id,
        service_id: service.id,
        event_date: reservationDate,
        total_amount: guestCount * 100,
        status: 'pending',
        notes: formatBookingNote(customerName, guestCount, comment),
      })

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
    return { error: message }
  }
}
