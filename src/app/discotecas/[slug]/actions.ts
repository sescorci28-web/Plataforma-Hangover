'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

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
  service_id: string | null
  club_id: string
  club_slug: string
  reservation_date: string
  event_date: string
  event_time: string
  number_of_people: number
  total_amount: number
  notes: string
  status: 'pending'
  booking_type: string
  qr_code: string
  qr_status: string
}

function formatSupabaseError(error: { message?: string; code?: string; details?: string; hint?: string } | null | undefined) {
  if (!error) {
    return 'Error desconocido.'
  }

  const parts = [error.message].filter(Boolean)

  if (error.code) {
    parts.push(`Código: ${error.code}`)
  }

  if (error.details) {
    parts.push(`Detalles: ${error.details}`)
  }

  if (error.hint) {
    parts.push(`Sugerencia: ${error.hint}`)
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

async function getOrCreateClubService(
  supabase: Awaited<ReturnType<typeof createClient>>,
  club: { id: string; name: string; provider_id: string; slug?: string | null }
): Promise<string | null> {
  const serviceDescription = `club_reservation:${club.id}`

  const { data: existingService, error: existingServiceError } = await supabase
    .from('services')
    .select('id')
    .eq('provider_id', club.provider_id)
    .eq('description', serviceDescription)
    .maybeSingle()

  if (existingServiceError) {
    console.error('[createClubReservation] Error consultando servicio proxy existente', {
      clubId: club.id,
      providerId: club.provider_id,
      error: formatSupabaseError(existingServiceError),
    })
  }

  return existingService?.id || null
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

    const serviceId = await getOrCreateClubService(supabase, club)

    const totalAmount = Number((guestCount * 100).toFixed(2))
    const notes = buildBookingNotes(customerName, guestCount, comment)

    const bookingPayload: ClubBookingPayload = {
      user_id: user.id,
      provider_id: club.provider_id,
      service_id: serviceId,
      club_id: club.id,
      club_slug: club.slug || '',
      reservation_date: reservationDate,
      event_date: reservationDate,
      event_time: '00:00:00',
      number_of_people: guestCount,
      total_amount: totalAmount,
      notes,
      status: 'pending',
      booking_type: 'club_vip',
      qr_code: 'QR-' + randomUUID(),
      qr_status: 'active',
    }

    const { error: bookingError } = await supabase.from('bookings').insert(bookingPayload)

    if (bookingError) {
      console.error('[createClubReservation] Error insertando reserva', {
        clubId: club.id,
        providerId: club.provider_id,
        serviceId,
        payload: bookingPayload,
        error: formatSupabaseError(bookingError),
      })
      return { error: `No se pudo guardar la reserva: ${formatSupabaseError(bookingError)}` }
    }

    revalidatePath('/dashboard/user')
    revalidatePath('/dashboard/provider')
    revalidatePath('/discotecas')

    return {
      success: true,
      message: `Reserva creada correctamente para ${customerName}. El proveedor revisará tu solicitud pronto.`,
    }
  } catch (error) {
    const err = error as any
    const message = err?.message || (typeof error === 'string' ? error : 'Ocurrió un error inesperado.')
    const code = err?.code
    const details = err?.details
    const hint = err?.hint

    console.error('[createClubReservation] Error inesperado en la reserva', {
      error: message,
      clubId: formData.get('clubId'),
    })

    const parts = [message]
    if (code) parts.push(`Código: ${code}`)
    if (details) parts.push(`Detalles: ${details}`)
    if (hint) parts.push(`Sugerencia: ${hint}`)

    return { error: parts.join(' | ') }
  }
}

export async function buyClubCover(_: ClubBookingState, formData: FormData): Promise<ClubBookingState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Debes iniciar sesión para comprar un cover.' }
  }

  const clubId = String(formData.get('clubId') || '')
  const customerName = String(formData.get('customer_name') || '').trim()
  const reservationDate = String(formData.get('reservation_date') || '').trim()
  const guestCount = parseGuestCount(formData.get('guest_count'))

  if (!clubId) {
    return { error: 'No se encontró la discoteca seleccionada.' }
  }

  if (!customerName) {
    return { error: 'El nombre del cliente es obligatorio.' }
  }

  if (!reservationDate) {
    return { error: 'La fecha de visita es obligatoria.' }
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
    return { error: 'La fecha de visita no puede ser anterior a hoy.' }
  }

  try {
    await ensureUserProfile(supabase, user.id)

    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, slug, provider_id, cover_price')
      .eq('id', clubId)
      .single()

    if (clubError || !club) {
      return { error: 'No se pudo cargar la discoteca para comprar el cover.' }
    }

    if (!club.provider_id) {
      return { error: 'Esta discoteca aún no tiene un proveedor asignado para gestionar la venta de covers.' }
    }

    const serviceId = await getOrCreateClubService(supabase, club)

    const coverPrice = Number(club.cover_price) || 0.0
    const totalAmount = Number((guestCount * coverPrice).toFixed(2))
    const notes = buildBookingNotes(customerName, guestCount, `Compra de Cover (${guestCount} pers. x $${coverPrice})`)

    const bookingPayload: ClubBookingPayload = {
      user_id: user.id,
      provider_id: club.provider_id,
      service_id: serviceId,
      club_id: club.id,
      club_slug: club.slug || '',
      reservation_date: reservationDate,
      event_date: reservationDate,
      event_time: '00:00:00',
      number_of_people: guestCount,
      total_amount: totalAmount,
      notes,
      status: 'pending', // Will be updated to 'confirmed' right below to compile with pending type constraint, or wait - status in ClubBookingPayload is 'pending'. Let's change ClubBookingPayload status type if we want, or just insert as status: 'confirmed' bypassing typed helper.
      booking_type: 'club_cover',
      qr_code: 'QR-' + randomUUID(),
      qr_status: 'active',
    }

    // Since ClubBookingPayload defines status: 'pending', but we want to insert 'confirmed', we override it here.
    const insertPayload = {
      ...bookingPayload,
      status: 'confirmed'
    }

    const { error: bookingError } = await supabase.from('bookings').insert(insertPayload)

    if (bookingError) {
      console.error('[buyClubCover] Error insertando cover', {
        clubId: club.id,
        providerId: club.provider_id,
        serviceId,
        payload: insertPayload,
        error: formatSupabaseError(bookingError),
      })
      return { error: `No se pudo guardar la compra del cover: ${formatSupabaseError(bookingError)}` }
    }

    revalidatePath('/dashboard/user')
    revalidatePath('/dashboard/provider')
    revalidatePath('/discotecas')

    return {
      success: true,
      message: `¡Cover comprado con éxito para ${customerName}! Tu entrada con código QR ya está activa y disponible en tu panel de usuario.`,
    }
  } catch (error) {
    const err = error as any
    const message = err?.message || (typeof error === 'string' ? error : 'Ocurrió un error inesperado.')
    console.error('[buyClubCover] Error inesperado en compra de cover', {
      error: message,
      clubId,
    })
    return { error: message }
  }
}
