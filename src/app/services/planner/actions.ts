'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function requestPlannerPackage(
  services: Array<{ serviceId: string; providerId: string; subtotal: number }>,
  eventDate: string,
  eventTime: string,
  guests: number,
  notes: string,
  eventType: string
) {
  const supabase = await createClient();

  // Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Debes iniciar sesión para realizar solicitudes de reserva." };
  }

  if (!services || services.length === 0) {
    return { error: "No seleccionaste ningún servicio para solicitar." };
  }

  try {
    // We will insert each service as an individual booking request
    const bookingsToInsert = services.map((item) => ({
      user_id: user.id,
      service_id: item.serviceId,
      provider_id: item.providerId,
      status: "pending",
      event_date: eventDate,
      event_time: eventTime || "00:00:00",
      total_amount: item.subtotal,
      number_of_people: guests,
      booking_type: "service",
      notes: `Solicitud de Hangover Planner - Evento: ${eventType}. ${notes || ""}`.trim()
    }));

    const { error: insertError } = await supabase
      .from("bookings")
      .insert(bookingsToInsert);

    if (insertError) {
      console.error("Error inserting planner bookings:", insertError);
      return { error: `Error al procesar las solicitudes: ${insertError.message}` };
    }

    revalidatePath("/dashboard/user");
    return { success: true, count: services.length };
  } catch (err: any) {
    console.error("Error in requestPlannerPackage action:", err);
    return { error: `Ocurrió un error inesperado: ${err.message}` };
  }
}
