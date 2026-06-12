'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { slugify } from "@/lib/slugify";

/**
 * Creates a service booking for a user.
 */
export async function createServiceBooking(
  serviceId: string,
  providerId: string,
  eventDate: string,
  totalAmount: number,
  notes?: string,
  quoteDetails?: {
    eventType?: string;
    bookingCity?: string;
    budget?: number;
    guestsCount?: number;
  }
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // 1. Ensure user profile exists to prevent foreign key constraint violations
  try {
    const { data: profile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profileCheckError || !profile) {
      // Create profile automatically
      const { error: createProfileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          role: "user",
          full_name: user.user_metadata?.name || user.email?.split("@")[0] || "Cliente",
          username: user.user_metadata?.username || user.email?.split("@")[0] || `cliente_${Math.random().toString(36).substring(2, 7)}`,
          city: "No especificada",
          bio: null,
          avatar_url: null,
          phone: null
        });

      if (createProfileError) {
        return { error: `No se pudo inicializar tu perfil de usuario automáticamente: ${createProfileError.message}` };
      }
    }
  } catch (err: any) {
    return { error: `Error al validar perfil de usuario: ${err.message}` };
  }

  try {
    const { error: insertError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        provider_id: providerId,
        service_id: serviceId,
        event_date: eventDate,
        total_amount: totalAmount,
        status: "pending",
        notes: notes || null,
        qr_code: 'QR-' + randomUUID(),
        qr_status: 'active',
        // Quotation details support
        event_type: quoteDetails?.eventType || null,
        booking_city: quoteDetails?.bookingCity || null,
        budget: quoteDetails?.budget || null,
        number_of_people: quoteDetails?.guestsCount || 1
      });

    if (insertError) {
      return { error: `Error al crear la reserva: ${insertError.message}` };
    }

    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/provider");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Ocurrió un error inesperado al procesar la reserva." };
  }
}

/**
 * Buys a ticket for an event.
 */
export async function createEventBooking(
  eventId: string,
  eventDate: string,
  totalAmount: number
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // 1. Ensure user profile exists to prevent foreign key constraint violations
  try {
    const { data: profile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profileCheckError || !profile) {
      // Create profile automatically
      const { error: createProfileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          role: "user",
          full_name: user.user_metadata?.name || user.email?.split("@")[0] || "Cliente",
          username: user.user_metadata?.username || user.email?.split("@")[0] || `cliente_${Math.random().toString(36).substring(2, 7)}`,
          city: "No especificada",
          bio: null,
          avatar_url: null,
          phone: null
        });

      if (createProfileError) {
        return { error: `No se pudo inicializar tu perfil de usuario automáticamente: ${createProfileError.message}` };
      }
    }
  } catch (err: any) {
    return { error: `Error al validar perfil de usuario: ${err.message}` };
  }

  try {
    // Fetch event creator to assign provider_id
    const { data: eventDataObj } = await supabase
      .from("events")
      .select("creator_id")
      .eq("id", eventId)
      .single();

    const providerId = eventDataObj?.creator_id || null;

    const { error: insertError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        event_id: eventId,
        provider_id: providerId,
        event_date: eventDate,
        total_amount: totalAmount,
        status: "confirmed", // Automatically confirm ticket purchases
        qr_code: 'QR-' + randomUUID(),
        qr_status: 'active'
      });

    if (insertError) {
      return { error: `Error al reservar entrada: ${insertError.message}` };
    }

    revalidatePath("/dashboard/user");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Ocurrió un error al procesar tu compra de entrada." };
  }
}

/**
 * Creates a new service (restricted to providers/admins).
 */
export async function createService(data: {
  title: string;
  description: string;
  price: number;
  category: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  subcategory?: string | null;
  base_city?: string | null;
  image_url?: string | null;
  cover_url?: string | null;
  video_url?: string | null;
  experience?: string | null;
  cities_coverage?: string[];
  social_media?: Record<string, string>;
  whatsapp_number?: string | null;
  tags?: string[];
  specialties?: string[];
  latitude?: number | null;
  longitude?: number | null;
  provider_status?: 'active' | 'vacation' | 'busy' | 'inactive';
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // Double check profile role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    return { error: "No autorizado. Solo proveedores pueden publicar servicios." };
  }

  try {
    const { error: insertError } = await supabase
      .from("services")
      .insert({
        provider_id: user.id,
        title: data.title,
        slug: slugify(data.title),
        description: data.description || null,
        price: data.price,
        category: data.category, // Dual-writing
        category_id: data.category_id || null,
        subcategory_id: data.subcategory_id || null,
        subcategory: data.subcategory || null,
        base_city: data.base_city || null,
        image_url: data.image_url || null,
        cover_url: data.cover_url || null,
        video_url: data.video_url || null,
        experience: data.experience || null,
        cities_coverage: data.cities_coverage || '{}',
        social_media: data.social_media || '{}',
        whatsapp_number: data.whatsapp_number || null,
        tags: data.tags || '{}',
        specialties: data.specialties || '{}',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        provider_status: data.provider_status || 'active'
      });

    if (insertError) {
      return { error: `Error al publicar el servicio: ${insertError.message}` };
    }

    revalidatePath("/services");
    revalidatePath("/dashboard/provider");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al crear el servicio." };
  }
}

/**
 * Updates a booking's status.
 */
export async function updateBookingStatus(
  bookingId: string,
  status: "confirmed" | "cancelled" | "completed" | "rejected"
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  try {
    // Fetch booking to verify authorization
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("provider_id, user_id")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return { error: "No se encontró la reserva." };
    }

    const isProvider = booking.provider_id === user.id;
    const isClient = booking.user_id === user.id;

    if (!isProvider && !isClient) {
      // Check if admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        return { error: "No autorizado para modificar esta reserva." };
      }
    }

    const updatePayload: any = { status };
    if (status === "cancelled" || status === "rejected") {
      updatePayload.qr_status = "cancelled";
    } else if (status === "confirmed") {
      updatePayload.qr_status = "active";
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (updateError) {
      return { error: `Error al actualizar la reserva: ${updateError.message}` };
    }

    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/provider");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar la reserva." };
  }
}

/**
 * Updates an existing service (restricted to providers/admins).
 */
export async function updateService(
  serviceId: string,
  data: {
    title: string;
    description: string;
    price: number;
    category: string;
    category_id?: string | null;
    subcategory_id?: string | null;
    subcategory?: string | null;
    base_city?: string | null;
    image_url?: string | null;
    cover_url?: string | null;
    video_url?: string | null;
    experience?: string | null;
    cities_coverage?: string[];
    social_media?: Record<string, string>;
    whatsapp_number?: string | null;
    tags?: string[];
    specialties?: string[];
    latitude?: number | null;
    longitude?: number | null;
    provider_status?: 'active' | 'vacation' | 'busy' | 'inactive';
  }
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // Double check profile role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    return { error: "No autorizado. Solo proveedores pueden modificar servicios." };
  }

  try {
    const { error: updateError } = await supabase
      .from("services")
      .update({
        title: data.title,
        slug: slugify(data.title),
        description: data.description || null,
        price: data.price,
        category: data.category, // Dual-writing
        category_id: data.category_id || null,
        subcategory_id: data.subcategory_id || null,
        subcategory: data.subcategory || null,
        base_city: data.base_city || null,
        image_url: data.image_url || null,
        cover_url: data.cover_url || null,
        video_url: data.video_url || null,
        experience: data.experience || null,
        cities_coverage: data.cities_coverage || '{}',
        social_media: data.social_media || '{}',
        whatsapp_number: data.whatsapp_number || null,
        tags: data.tags || '{}',
        specialties: data.specialties || '{}',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        provider_status: data.provider_status || 'active'
      })
      .eq("id", serviceId)
      .eq("provider_id", user.id);

    if (updateError) {
      return { error: `Error al actualizar el servicio: ${updateError.message}` };
    }

    revalidatePath("/services");
    revalidatePath("/dashboard/provider");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar el servicio." };
  }
}

/**
 * Deletes an existing service (restricted to providers/admins).
 */
export async function deleteService(serviceId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // Double check profile role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    return { error: "No autorizado. Solo proveedores pueden eliminar servicios." };
  }

  try {
    const { error: deleteError } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq("provider_id", user.id);

    if (deleteError) {
      return { error: `Error al eliminar el servicio: ${deleteError.message}` };
    }

    revalidatePath("/services");
    revalidatePath("/dashboard/provider");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al eliminar el servicio." };
  }
}

/**
 * Creates a new event (restricted to providers/admins).
 */
export async function createEvent(
  title: string,
  description: string,
  eventDate: string,
  location: string,
  ticketPrice: number,
  imageUrl?: string
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // Double check profile role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    return { error: "No autorizado. Solo proveedores pueden crear eventos." };
  }

  try {
    const { error: insertError } = await supabase
      .from("events")
      .insert({
        creator_id: user.id,
        title,
        description: description || null,
        event_date: eventDate,
        location,
        ticket_price: ticketPrice,
        image_url: imageUrl || null
      });

    if (insertError) {
      return { error: `Error al crear el evento: ${insertError.message}` };
    }

    revalidatePath("/events");
    revalidatePath("/dashboard/provider");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al crear el evento." };
  }
}

/**
 * Validates a QR code and marks it as used.
 */
export async function validateQRCode(qrCode: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // 1. Get validator profile role (provider or admin)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    return { error: "No tienes permisos de proveedor o administrador para validar códigos QR." };
  }

  try {
    // 2. Fetch booking by qr_code
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, provider_id, qr_status, number_of_people, user_id, event_id, club_id, total_amount, event_date, booking_type")
      .eq("qr_code", qrCode)
      .maybeSingle();

    if (bookingError) {
      return { error: `Error al buscar la entrada/reserva: ${bookingError.message}` };
    }

    if (!booking) {
      return { error: "El código QR ingresado no existe en la base de datos." };
    }

    // 3. Check authorization (provider must own the service/club/event, i.e. booking.provider_id === user.id)
    if (profile.role === "provider" && booking.provider_id !== user.id) {
      return { error: "No estás autorizado para validar este código QR. Pertenece a otro proveedor." };
    }

    // 4. Validate QR code status
    if (booking.qr_status === "used") {
      return { error: "Este código QR ya ha sido usado y validado anteriormente." };
    }

    if (booking.qr_status === "cancelled") {
      return { error: "Esta entrada o reserva ha sido cancelada." };
    }

    // 5. Validate booking status
    if (booking.status !== "confirmed" && booking.status !== "completed") {
      return { error: `La reserva asociada a este QR no está confirmada (Estado: ${booking.status}).` };
    }

    // 6. Mark QR as used
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        qr_status: "used",
        qr_validated_at: new Date().toISOString(),
        status: "completed" // Automatically complete the booking when validated
      })
      .eq("id", booking.id);

    if (updateError) {
      return { error: `Error al marcar el QR como usado: ${updateError.message}` };
    }

    // 7. Fetch buyer profile name
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", booking.user_id)
      .single();

    // 8. Fetch target title (event name or club name)
    let targetTitle = "Entrada/Reserva";
    if (booking.event_id) {
      const { data: eventData } = await supabase
        .from("events")
        .select("title")
        .eq("id", booking.event_id)
        .single();
      if (eventData) targetTitle = eventData.title;
    } else if (booking.club_id) {
      const { data: clubData } = await supabase
        .from("clubs")
        .select("name")
        .eq("id", booking.club_id)
        .single();
      if (clubData) targetTitle = clubData.name;
    }

    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/provider");

    return {
      success: true,
      bookingDetails: {
        id: booking.id,
        buyerName: buyerProfile?.full_name || "Cliente Hangover",
        title: targetTitle,
        numberOfPeople: booking.number_of_people || 1,
        totalAmount: booking.total_amount,
        eventDate: booking.event_date,
        bookingType: booking.booking_type
      }
    };

  } catch (err: any) {
    return { error: err.message || "Ocurrió un error inesperado al validar el QR." };
  }
}

/**
 * Audits a QR code and returns booking details without marking it as used.
 */
export async function checkQRCode(qrCode: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // 1. Get validator profile role (provider or admin)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    return { error: "No tienes permisos de proveedor o administrador para auditar códigos QR." };
  }

  try {
    // 2. Fetch booking by qr_code
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, provider_id, qr_status, qr_validated_at, number_of_people, user_id, event_id, club_id, total_amount, event_date, booking_type")
      .eq("qr_code", qrCode)
      .maybeSingle();

    if (bookingError) {
      return { error: `Error al buscar la entrada/reserva: ${bookingError.message}` };
    }

    if (!booking) {
      return { error: "El código QR ingresado no existe en la base de datos." };
    }

    // 3. Check authorization (provider must own the service/club/event, i.e. booking.provider_id === user.id)
    if (profile.role === "provider" && booking.provider_id !== user.id) {
      return { error: "No estás autorizado para validar este código QR. Pertenece a otro proveedor." };
    }

    // 4. Fetch buyer profile name
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", booking.user_id)
      .single();

    // 5. Fetch target title (event name or club name)
    let targetTitle = "Entrada/Reserva";
    if (booking.event_id) {
      const { data: eventData } = await supabase
        .from("events")
        .select("title")
        .eq("id", booking.event_id)
        .single();
      if (eventData) targetTitle = eventData.title;
    } else if (booking.club_id) {
      const { data: clubData } = await supabase
        .from("clubs")
        .select("name")
        .eq("id", booking.club_id)
        .single();
      if (clubData) targetTitle = clubData.name;
    }

    const bookingDetails = {
      id: booking.id,
      buyerName: buyerProfile?.full_name || "Cliente Hangover",
      title: targetTitle,
      numberOfPeople: booking.number_of_people || 1,
      totalAmount: booking.total_amount,
      eventDate: booking.event_date,
      bookingType: booking.booking_type,
      qrValidatedAt: booking.qr_validated_at
    };

    // 6. Return specific status states based on the audit
    if (booking.qr_status === "used") {
      return {
        success: true,
        status: "used",
        bookingDetails
      };
    }

    if (booking.qr_status === "cancelled") {
      return {
        success: true,
        status: "cancelled",
        bookingDetails
      };
    }

    if (booking.status !== "confirmed" && booking.status !== "completed") {
      return {
        success: true,
        status: "invalid", // Not confirmed/completed
        bookingDetails
      };
    }

    return {
      success: true,
      status: "valid",
      bookingDetails
    };

  } catch (err: any) {
    return { error: err.message || "Ocurrió un error inesperado al auditar el QR." };
  }
}

/**
 * Confirms QR admission, marking it as used in Supabase.
 */
export async function confirmQRAdmission(bookingId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // 1. Get validator profile role (provider or admin)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    return { error: "No tienes permisos de proveedor o administrador para validar códigos QR." };
  }

  try {
    // 2. Fetch booking by id
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, provider_id, qr_status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      return { error: `Error al buscar la entrada/reserva: ${bookingError.message}` };
    }

    if (!booking) {
      return { error: "La reserva ingresada no existe." };
    }

    // 3. Check authorization (provider must own the service/club/event, i.e. booking.provider_id === user.id)
    if (profile.role === "provider" && booking.provider_id !== user.id) {
      return { error: "No estás autorizado para validar este código QR. Pertenece a otro proveedor." };
    }

    // 4. Validate QR code status
    if (booking.qr_status === "used") {
      return { error: "Este código QR ya ha sido usado y validado anteriormente." };
    }

    if (booking.qr_status === "cancelled") {
      return { error: "Esta entrada o reserva ha sido cancelada." };
    }

    // 5. Validate booking status
    if (booking.status !== "confirmed" && booking.status !== "completed") {
      return { error: `La reserva asociada a este QR no está confirmada (Estado: ${booking.status}).` };
    }

    // 6. Mark QR as used
    const nowStr = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        qr_status: "used",
        qr_validated_at: nowStr,
        status: "completed" // Automatically complete the booking when validated
      })
      .eq("id", booking.id);

    if (updateError) {
      return { error: `Error al marcar el QR como usado: ${updateError.message}` };
    }

    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/provider");

    return {
      success: true,
      qrValidatedAt: nowStr
    };

  } catch (err: any) {
    return { error: err.message || "Ocurrió un error inesperado al confirmar la admisión." };
  }
}

/**
 * Validates a QR code and logs the entry attempt (approved/rejected/warning) in admission_logs.
 * Resilient fallback: if the logs table does not exist, validation still works!
 */
export async function validateQRCodeAndLog(
  qrCode: string,
  device: string = "Dispositivo desconocido",
  autoConfirm: boolean = true
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // 1. Get validator profile role (provider or admin)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    return { error: "No tienes permisos de proveedor o administrador para validar códigos QR." };
  }

  try {
    // 2. Fetch booking by qr_code
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, provider_id, qr_status, number_of_people, user_id, event_id, club_id, total_amount, event_date, booking_type")
      .eq("qr_code", qrCode)
      .maybeSingle();

    if (bookingError) {
      return { error: `Error al buscar la entrada/reserva: ${bookingError.message}` };
    }

    if (!booking) {
      // Log rejected attempt (QR does not exist)
      try {
        await supabase.from("admission_logs").insert({
          operator_id: user.id,
          status: "rejected",
          access_type: "unknown",
          buyer_name: "Código Inexistente",
          device,
          error_reason: "Código QR no existe en la base de datos."
        });
      } catch (logErr) {
        console.warn("Could not insert log (table may not exist):", logErr);
      }
      return { error: "El código QR ingresado no existe en la base de datos." };
    }

    // 3. Fetch buyer profile name
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", booking.user_id)
      .single();

    const buyerName = buyerProfile?.full_name || "Cliente Hangover";

    // 4. Fetch target title (event name or club name)
    let targetTitle = "Entrada/Reserva";
    if (booking.event_id) {
      const { data: eventData } = await supabase
        .from("events")
        .select("title")
        .eq("id", booking.event_id)
        .single();
      if (eventData) targetTitle = eventData.title;
    } else if (booking.club_id) {
      const { data: clubData } = await supabase
        .from("clubs")
        .select("name")
        .eq("id", booking.club_id)
        .single();
      if (clubData) targetTitle = clubData.name;
    }

    const bookingDetails = {
      id: booking.id,
      buyerName,
      title: targetTitle,
      numberOfPeople: booking.number_of_people || 1,
      totalAmount: booking.total_amount,
      eventDate: booking.event_date,
      bookingType: booking.booking_type
    };

    // 5. Check authorization (provider must own the booking)
    if (profile.role === "provider" && booking.provider_id !== user.id) {
      try {
        await supabase.from("admission_logs").insert({
          provider_id: booking.provider_id,
          booking_id: booking.id,
          user_id: booking.user_id,
          operator_id: user.id,
          status: "rejected",
          access_type: booking.booking_type,
          buyer_name: buyerName,
          device,
          error_reason: "No estás autorizado para validar este código QR. Pertenece a otro proveedor."
        });
      } catch (logErr) {
        console.warn("Could not insert log:", logErr);
      }
      return { error: "No estás autorizado para validar este código QR. Pertenece a otro proveedor." };
    }

    // 6. Validate QR code status
    if (booking.qr_status === "used") {
      try {
        await supabase.from("admission_logs").insert({
          provider_id: booking.provider_id,
          booking_id: booking.id,
          user_id: booking.user_id,
          operator_id: user.id,
          status: "warning",
          access_type: booking.booking_type,
          buyer_name: buyerName,
          device,
          error_reason: "Este código QR ya ha sido usado y validado anteriormente."
        });
      } catch (logErr) {
        console.warn("Could not insert log:", logErr);
      }
      return {
        status: "used",
        error: "Este código QR ya ha sido usado y validado anteriormente.",
        bookingDetails
      };
    }

    if (booking.qr_status === "cancelled") {
      try {
        await supabase.from("admission_logs").insert({
          provider_id: booking.provider_id,
          booking_id: booking.id,
          user_id: booking.user_id,
          operator_id: user.id,
          status: "rejected",
          access_type: booking.booking_type,
          buyer_name: buyerName,
          device,
          error_reason: "Esta entrada o reserva ha sido cancelada."
        });
      } catch (logErr) {
        console.warn("Could not insert log:", logErr);
      }
      return {
        status: "cancelled",
        error: "Esta entrada o reserva ha sido cancelada.",
        bookingDetails
      };
    }

    // 7. Validate booking status
    if (booking.status !== "confirmed" && booking.status !== "completed") {
      try {
        await supabase.from("admission_logs").insert({
          provider_id: booking.provider_id,
          booking_id: booking.id,
          user_id: booking.user_id,
          operator_id: user.id,
          status: "rejected",
          access_type: booking.booking_type,
          buyer_name: buyerName,
          device,
          error_reason: `La reserva asociada a este QR no está confirmada (Estado: ${booking.status}).`
        });
      } catch (logErr) {
        console.warn("Could not insert log:", logErr);
      }
      return {
        status: "invalid",
        error: `La reserva asociada a este QR no está confirmada (Estado: ${booking.status}).`,
        bookingDetails
      };
    }

    // If autoConfirm is FALSE, return valid without marking it used yet
    if (!autoConfirm) {
      return {
        success: true,
        status: "valid",
        bookingDetails
      };
    }

    // 8. Auto-Confirm: Mark QR as used
    const nowStr = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        qr_status: "used",
        qr_validated_at: nowStr,
        status: "completed"
      })
      .eq("id", booking.id);

    if (updateError) {
      return { error: `Error al marcar el QR como usado: ${updateError.message}` };
    }

    // Write successful audit log
    try {
      await supabase.from("admission_logs").insert({
        provider_id: booking.provider_id,
        booking_id: booking.id,
        user_id: booking.user_id,
        operator_id: user.id,
        status: "approved",
        access_type: booking.booking_type,
        buyer_name: buyerName,
        device
      });
    } catch (logErr) {
      console.warn("Could not insert log:", logErr);
    }

    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/provider");

    return {
      success: true,
      status: "valid",
      bookingDetails: {
        ...bookingDetails,
        qrValidatedAt: nowStr
      }
    };

  } catch (err: any) {
    return { error: err.message || "Ocurrió un error inesperado al procesar el QR." };
  }
}

/**
 * Manually confirms QR admission, marking it as used and writing an approved log.
 */
export async function confirmQRAdmissionAndLog(bookingId: string, device: string = "Dispositivo desconocido") {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // 1. Get validator profile role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    return { error: "No tienes permisos de proveedor o administrador para validar códigos QR." };
  }

  try {
    // 2. Fetch booking by id
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, provider_id, qr_status, user_id, booking_type")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      return { error: `Error al buscar la entrada/reserva: ${bookingError.message}` };
    }

    if (!booking) {
      return { error: "La reserva ingresada no existe." };
    }

    // 3. Check authorization
    if (profile.role === "provider" && booking.provider_id !== user.id) {
      return { error: "No estás autorizado para validar este código QR. Pertenece a otro proveedor." };
    }

    // 4. Validate QR code status
    if (booking.qr_status === "used") {
      return { error: "Este código QR ya ha sido usado y validado anteriormente." };
    }

    if (booking.qr_status === "cancelled") {
      return { error: "Esta entrada o reserva ha sido cancelada." };
    }

    // 5. Mark QR as used
    const nowStr = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        qr_status: "used",
        qr_validated_at: nowStr,
        status: "completed"
      })
      .eq("id", booking.id);

    if (updateError) {
      return { error: `Error al marcar el QR como usado: ${updateError.message}` };
    }

    // 6. Fetch buyer profile name
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", booking.user_id)
      .single();
    const buyerName = buyerProfile?.full_name || "Cliente Hangover";

    // 7. Write successful audit log
    try {
      await supabase.from("admission_logs").insert({
        provider_id: booking.provider_id,
        booking_id: booking.id,
        user_id: booking.user_id,
        operator_id: user.id,
        status: "approved",
        access_type: booking.booking_type,
        buyer_name: buyerName,
        device
      });
    } catch (logErr) {
      console.warn("Could not insert log:", logErr);
    }

    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/provider");

    return {
      success: true,
      qrValidatedAt: nowStr
    };

  } catch (err: any) {
    return { error: err.message || "Ocurrió un error inesperado al confirmar la admisión." };
  }
}

/**
 * Retrieves gate/access stats for today.
 * Falls back to scanning bookings directly if admission_logs doesn't exist yet.
 */
export async function getGateStats(providerId?: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  const activeProviderId = providerId || user.id;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  try {
    // 1. Try querying admission_logs
    const { data: logs, error: logsError } = await supabase
      .from("admission_logs")
      .select("status, access_type")
      .eq("provider_id", activeProviderId)
      .gte("created_at", startOfToday);

    if (logsError) throw logsError;

    let valid = 0;
    let rejected = 0;
    let covers = 0;
    let reservations = 0;

    (logs || []).forEach((log) => {
      if (log.status === "approved") {
        valid++;
        if (log.access_type === "club_cover") {
          covers++;
        } else {
          reservations++;
        }
      } else {
        rejected++;
      }
    });

    return {
      success: true,
      stats: {
        valid,
        rejected,
        covers,
        reservations,
        totalToday: valid
      }
    };

  } catch (err) {
    console.warn("Admission logs query failed, falling back to bookings table:", err);

    // Fallback: Query bookings table for successfully validated tickets today
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("booking_type")
        .eq("provider_id", activeProviderId)
        .eq("qr_status", "used")
        .gte("qr_validated_at", startOfToday);

      if (bookingsError) {
        return { error: bookingsError.message };
      }

      let valid = 0;
      let covers = 0;
      let reservations = 0;

      (bookings || []).forEach((b) => {
        valid++;
        if (b.booking_type === "club_cover") {
          covers++;
        } else {
          reservations++;
        }
      });

      return {
        success: true,
        stats: {
          valid,
          rejected: 0, // Fallback cannot query rejected logs
          covers,
          reservations,
          totalToday: valid
        }
      };
    } catch (fallbackErr: any) {
      return { error: fallbackErr.message || "Error al calcular estadísticas." };
    }
  }
}

/**
 * Retrieves the last 5 accesses (attempts) for the operator.
 * Falls back to bookings if logs table is not yet created.
 */
export async function getLastAccesses(providerId?: string, limit: number = 5) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  const activeProviderId = providerId || user.id;

  try {
    const { data: logs, error: logsError } = await supabase
      .from("admission_logs")
      .select("id, buyer_name, access_type, status, created_at, error_reason")
      .eq("provider_id", activeProviderId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (logsError) throw logsError;

    const formattedLogs = (logs || []).map((log) => ({
      id: log.id,
      buyerName: log.buyer_name || "Cliente Hangover",
      accessType: log.access_type,
      status: log.status,
      errorReason: log.error_reason,
      time: new Date(log.created_at).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    }));

    return { success: true, accesses: formattedLogs };

  } catch (err) {
    console.warn("Admission logs query failed for last accesses, falling back to bookings table:", err);

    // Fallback: Query bookings table for successfully validated tickets
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, user_id, booking_type, qr_validated_at")
        .eq("provider_id", activeProviderId)
        .eq("qr_status", "used")
        .order("qr_validated_at", { ascending: false })
        .limit(limit);

      if (bookingsError) {
        return { error: bookingsError.message };
      }

      const formattedBookings = [];
      for (const b of bookings || []) {
        // Fetch client profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", b.user_id)
          .single();

        formattedBookings.push({
          id: b.id,
          buyerName: profile?.full_name || "Cliente Hangover",
          accessType: b.booking_type,
          status: "approved",
          errorReason: null,
          time: b.qr_validated_at
            ? new Date(b.qr_validated_at).toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              })
            : "—"
        });
      }

      return { success: true, accesses: formattedBookings };
    } catch (fallbackErr: any) {
      return { error: fallbackErr.message || "Error al consultar accesos." };
    }
  }
}

/**
 * Creates a review for a completed service booking.
 */
export async function createServiceReview(
  bookingId: string,
  serviceId: string,
  rating: number,
  comment: string
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  try {
    // 1. Verify booking exists, is completed/confirmed, belongs to user, and matches the service
    const { data: booking, error: bookingCheckErr } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .eq("service_id", serviceId)
      .single();

    if (bookingCheckErr || !booking) {
      return { error: "No se encontró una reserva válida o no pertenece a tu usuario." };
    }

    if (booking.status !== "confirmed" && booking.status !== "completed") {
      return { error: "Solo puedes calificar servicios que hayan sido confirmados o completados." };
    }

    // 2. Insert review
    const { error: insertErr } = await supabase
      .from("service_reviews")
      .insert({
        booking_id: bookingId,
        user_id: user.id,
        service_id: serviceId,
        rating,
        comment: comment || null
      });

    if (insertErr) {
      return { error: `Error al publicar la reseña: ${insertErr.message}` };
    }

    // 3. Recalculate average_rating in services table
    const { data: reviews } = await supabase
      .from("service_reviews")
      .select("rating")
      .eq("service_id", serviceId);

    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await supabase
        .from("services")
        .update({ average_rating: Number(avg.toFixed(2)) })
        .eq("id", serviceId);
    }

    revalidatePath(`/services`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al publicar la reseña." };
  }
}

/**
 * Gets reviews for a service.
 */
export async function getServiceReviews(serviceId: string) {
  const supabase = await createClient();
  try {
    const { data: reviews, error } = await supabase
      .from("service_reviews")
      .select(`
        *,
        user:profiles!service_reviews_user_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq("service_id", serviceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, reviews: reviews || [] };
  } catch (err: any) {
    return { error: err.message || "Error al obtener las reseñas." };
  }
}

/**
 * Gets availability and bookings status for a service.
 */
export async function getServiceAvailability(serviceId: string) {
  const supabase = await createClient();
  try {
    // 1. Fetch manual overrides
    const { data: manual, error: manualErr } = await supabase
      .from("service_availability")
      .select("date, status, notes")
      .eq("service_id", serviceId);

    if (manualErr) throw manualErr;

    // 2. Fetch confirmed/completed bookings to automatically block dates
    const { data: bookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select("event_date")
      .eq("service_id", serviceId)
      .in("status", ["confirmed", "completed"]);

    if (bookingsErr) throw bookingsErr;

    return { 
      success: true, 
      manual: manual || [], 
      bookings: (bookings || []).map(b => b.event_date) 
    };
  } catch (err: any) {
    return { error: err.message || "Error al obtener la disponibilidad." };
  }
}

/**
 * Block/Unblock a date in availability.
 */
export async function toggleServiceAvailabilityDate(
  serviceId: string,
  dateStr: string,
  status: 'available' | 'blocked'
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  try {
    // Verify provider owns the service
    const { data: service, error: serviceCheckErr } = await supabase
      .from("services")
      .select("id")
      .eq("id", serviceId)
      .eq("provider_id", user.id)
      .single();

    if (serviceCheckErr || !service) {
      return { error: "No autorizado o el servicio no existe." };
    }

    if (status === 'available') {
      // Delete manual block
      const { error: delErr } = await supabase
        .from("service_availability")
        .delete()
        .eq("service_id", serviceId)
        .eq("date", dateStr);
      if (delErr) throw delErr;
    } else {
      // Insert or update block
      const { error: upsertErr } = await supabase
        .from("service_availability")
        .upsert({
          service_id: serviceId,
          date: dateStr,
          status: 'blocked'
        }, { onConflict: 'service_id,date' });
      if (upsertErr) throw upsertErr;
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar la disponibilidad." };
  }
}

/**
 * Gets media (stories and gallery items) for a service.
 */
export async function getServiceMedia(serviceId: string) {
  const supabase = await createClient();
  try {
    const { data: stories, error: storiesErr } = await supabase
      .from("service_stories")
      .select("*")
      .eq("service_id", serviceId)
      .order("display_order", { ascending: true });

    if (storiesErr) throw storiesErr;

    const { data: gallery, error: galleryErr } = await supabase
      .from("service_gallery_items")
      .select("*")
      .eq("service_id", serviceId)
      .order("display_order", { ascending: true });

    if (galleryErr) throw galleryErr;

    return { success: true, stories: stories || [], gallery: gallery || [] };
  } catch (err: any) {
    return { error: err.message || "Error al obtener multimedia." };
  }
}

/**
 * Gets past events (historial) for a service.
 */
export async function getServicePastEvents(serviceId: string) {
  const supabase = await createClient();
  try {
    const { data: events, error } = await supabase
      .from("service_past_events")
      .select("*")
      .eq("service_id", serviceId)
      .order("event_date", { ascending: false });

    if (error) throw error;
    return { success: true, events: events || [] };
  } catch (err: any) {
    return { error: err.message || "Error al obtener eventos realizados." };
  }
}

/**
 * Creates a past event entry.
 */
export async function createServicePastEvent(
  serviceId: string,
  title: string,
  eventDate: string,
  description: string,
  mediaUrls: string[]
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  try {
    // Verify provider owns the service
    const { data: service, error: serviceCheckErr } = await supabase
      .from("services")
      .select("id")
      .eq("id", serviceId)
      .eq("provider_id", user.id)
      .single();

    if (serviceCheckErr || !service) {
      return { error: "No autorizado." };
    }

    const { error: insertErr } = await supabase
      .from("service_past_events")
      .insert({
        service_id: serviceId,
        title,
        event_date: eventDate,
        description: description || null,
        media_urls: mediaUrls || []
      });

    if (insertErr) throw insertErr;
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al guardar el evento realizado." };
  }
}

/**
 * Deletes a past event.
 */
export async function deleteServicePastEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  try {
    // Check ownership
    const { data: event, error: eventErr } = await supabase
      .from("service_past_events")
      .select("*, service:services(provider_id)")
      .eq("id", eventId)
      .single();

    if (eventErr || !event) {
      return { error: "No se encontró el evento." };
    }

    const providerId = (event.service as any)?.provider_id;
    if (providerId !== user.id) {
      return { error: "No autorizado para eliminar este evento." };
    }

    const { error: delErr } = await supabase
      .from("service_past_events")
      .delete()
      .eq("id", eventId);

    if (delErr) throw delErr;
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al eliminar el evento." };
  }
}

/**
 * Updates productions URLs (Spotify, SoundCloud, YouTube).
 */
export async function updateServiceProductions(
  serviceId: string,
  spotifyUrl: string,
  soundcloudUrl: string,
  youtubeUrl: string
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  try {
    const { error: updateErr } = await supabase
      .from("services")
      .update({
        spotify_url: spotifyUrl || null,
        soundcloud_url: soundcloudUrl || null,
        youtube_url: youtubeUrl || null
      })
      .eq("id", serviceId)
      .eq("provider_id", user.id);

    if (updateErr) throw updateErr;
    
    revalidatePath(`/services`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar producciones." };
  }
}
