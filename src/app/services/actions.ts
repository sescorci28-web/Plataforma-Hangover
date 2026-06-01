'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
        notes: notes || null
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

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status })
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


