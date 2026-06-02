'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

/**
 * Creates a service booking for a user.
 */
export async function createServiceBooking(
  serviceId: string,
  providerId: string,
  eventDate: string,
  totalAmount: number,
  notes?: string
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
        qr_status: 'active'
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
export async function createService(
  title: string,
  description: string,
  price: number,
  category: string,
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
    return { error: "No autorizado. Solo proveedores pueden publicar servicios." };
  }

  try {
    const { error: insertError } = await supabase
      .from("services")
      .insert({
        provider_id: user.id,
        title,
        description: description || null,
        price,
        category,
        image_url: imageUrl || null
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
  title: string,
  description: string,
  price: number,
  category: string,
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
    return { error: "No autorizado. Solo proveedores pueden modificar servicios." };
  }

  try {
    const { error: updateError } = await supabase
      .from("services")
      .update({
        title,
        description: description || null,
        price,
        category,
        image_url: imageUrl || null
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
      .select("id, status, provider_id, qr_status, number_of_people, user_id, event_id, club_id, total_amount, event_date")
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
        eventDate: booking.event_date
      }
    };

  } catch (err: any) {
    return { error: err.message || "Ocurrió un error inesperado al validar el QR." };
  }
}



