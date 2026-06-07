'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Checks in a user to a club or event after verification, setting expires_at.
 */
export async function checkInUser(data: {
  clubId?: string | null;
  eventId?: string | null;
  bookingId: string;
  visibility: 'visible' | 'invisible';
  status: 'available' | 'observing' | 'do_not_disturb';
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  // Fetch booking details to get qr_validated_at
  const { data: booking, error: bookingErr } = await supabase
    .from("bookings")
    .select("qr_validated_at")
    .eq("id", data.bookingId)
    .single();

  if (bookingErr || !booking) {
    return { error: "No se encontró una reserva válida para este check-in." };
  }

  // Calculate expires_at: 8 hours from QR validation or 6:00 AM (for clubs), whichever is earlier
  const qrValidatedAt = booking.qr_validated_at ? new Date(booking.qr_validated_at) : new Date();
  const eightHoursLater = new Date(qrValidatedAt.getTime() + 8 * 60 * 60 * 1000);
  let expiresAt = eightHoursLater;

  if (data.clubId) {
    // 6:00 AM boundary logic: if it's after 6 AM of the validation date, the boundary is tomorrow's 6 AM.
    // If it's before 6 AM of the validation date (e.g. 2:00 AM), the boundary is that day's 6 AM.
    const sixAmTodayOrTomorrow = new Date(qrValidatedAt);
    sixAmTodayOrTomorrow.setHours(6, 0, 0, 0);
    if (qrValidatedAt.getHours() >= 6) {
      sixAmTodayOrTomorrow.setDate(sixAmTodayOrTomorrow.getDate() + 1);
    }
    
    if (sixAmTodayOrTomorrow.getTime() < eightHoursLater.getTime()) {
      expiresAt = sixAmTodayOrTomorrow;
    }
  }

  const now = new Date();

  try {
    // Clean up any stale presence records for this user first
    await supabase
      .from("connect_presence")
      .delete()
      .eq("user_id", user.id)
      .or(`club_id.eq.${data.clubId || 'null'},event_id.eq.${data.eventId || 'null'}`);

    const { error: insertError } = await supabase
      .from("connect_presence")
      .insert({
        user_id: user.id,
        club_id: data.clubId || null,
        event_id: data.eventId || null,
        booking_id: data.bookingId,
        visibility: data.visibility,
        status: data.status,
        check_in_at: now.toISOString(),
        last_seen_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      return { error: `Error al registrar tu ingreso: ${insertError.message}` };
    }

    if (data.clubId) revalidatePath(`/discotecas/${data.clubId}`);
    if (data.eventId) revalidatePath(`/events/${data.eventId}`);
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al realizar check-in." };
  }
}

/**
 * Manually logs out a user from a local community.
 */
export async function checkOutUser(data: {
  clubId?: string | null;
  eventId?: string | null;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  try {
    const query = supabase
      .from("connect_presence")
      .delete()
      .eq("user_id", user.id);
      
    if (data.clubId) query.eq("club_id", data.clubId);
    if (data.eventId) query.eq("event_id", data.eventId);

    const { error: deleteError } = await query;
    if (deleteError) {
      return { error: `Error al desconectarse: ${deleteError.message}` };
    }

    if (data.clubId) revalidatePath(`/discotecas/${data.clubId}`);
    if (data.eventId) revalidatePath(`/events/${data.eventId}`);

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al desconectarse." };
  }
}

/**
 * Updates a presence record last_seen_at timestamp to avoid inactivity expiry.
 * Also triggers a background cleanup query to keep the table clean.
 */
export async function updatePresenceHeartbeat(data: {
  clubId?: string | null;
  eventId?: string | null;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No autenticado." };
  }

  const now = new Date();

  try {
    // 1. Run background cleanup of expired records (expired or lost pings > 15 minutes)
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
    await supabase
      .from("connect_presence")
      .delete()
      .or(`expires_at.lt.${now.toISOString()},last_seen_at.lt.${fifteenMinsAgo}`);

    // 2. Perform heartbeat update for the current user
    const query = supabase
      .from("connect_presence")
      .update({ last_seen_at: now.toISOString() })
      .eq("user_id", user.id);

    if (data.clubId) query.eq("club_id", data.clubId);
    if (data.eventId) query.eq("event_id", data.eventId);

    const { error: updateError } = await query;
    if (updateError) {
      return { error: `Error de heartbeat: ${updateError.message}` };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Heartbeat error." };
  }
}

/**
 * Sends a conversation/connection request to another checked-in user.
 */
export async function sendConnectRequest(data: {
  receiverId: string;
  clubId?: string | null;
  eventId?: string | null;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  if (user.id === data.receiverId) {
    return { error: "No puedes conectarte contigo mismo." };
  }

  try {
    const { error: insertError } = await supabase
      .from("connect_requests")
      .insert({
        sender_id: user.id,
        receiver_id: data.receiverId,
        club_id: data.clubId || null,
        event_id: data.eventId || null,
        status: 'pending'
      });

    if (insertError) {
      // Handle duplicates or blocks
      if (insertError.code === '23505') {
        return { error: "Ya enviaste una solicitud de conexión a este usuario." };
      }
      return { error: `No se pudo enviar la solicitud: ${insertError.message}` };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al conectar." };
  }
}

/**
 * Accepts or rejects a pending connection request.
 * If accepted, it initializes a permanent connect_chats conversation.
 */
export async function handleConnectRequest(data: {
  requestId: string;
  status: 'accepted' | 'rejected';
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  try {
    // 1. Fetch details of request to ensure ownership and get sender info
    const { data: request, error: fetchError } = await supabase
      .from("connect_requests")
      .select("sender_id, receiver_id, club_id, event_id")
      .eq("id", data.requestId)
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (fetchError || !request) {
      return { error: "Solicitud no encontrada o ya procesada." };
    }

    // 2. Update status
    const { error: updateError } = await supabase
      .from("connect_requests")
      .update({ status: data.status })
      .eq("id", data.requestId);

    if (updateError) {
      return { error: `Error al procesar la solicitud: ${updateError.message}` };
    }

    // 3. If accepted, create a chat
    if (data.status === 'accepted') {
      // Order UUIDs alphabetically to avoid duplicate channels between same two users
      const [userA, userB] = [request.sender_id, request.receiver_id].sort();
      
      const { data: existingChat } = await supabase
        .from("connect_chats")
        .select("id")
        .eq("user_a_id", userA)
        .eq("user_b_id", userB)
        .maybeSingle();

      if (!existingChat) {
        const { error: chatError } = await supabase
          .from("connect_chats")
          .insert({
            user_a_id: userA,
            user_b_id: userB,
            club_id: request.club_id || null,
            event_id: request.event_id || null
          });

        if (chatError) {
          console.error("Error creating chat channel:", chatError);
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al responder solicitud." };
  }
}

/**
 * Inserts a message into an active chat.
 */
export async function sendConnectMessage(data: {
  chatId: string;
  messageText: string;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  if (!data.messageText.trim()) {
    return { error: "El mensaje no puede estar vacío." };
  }

  try {
    const { error: insertError } = await supabase
      .from("connect_messages")
      .insert({
        chat_id: data.chatId,
        sender_id: user.id,
        message_text: data.messageText.trim()
      });

    if (insertError) {
      return { error: `Error al enviar mensaje: ${insertError.message}` };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al enviar mensaje." };
  }
}

/**
 * Blocks another user, preventing presence views and connections.
 */
export async function blockUser(data: {
  blockedId: string;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  try {
    const { error: insertError } = await supabase
      .from("connect_blocks")
      .insert({
        blocker_id: user.id,
        blocked_id: data.blockedId
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return { error: "Ya has bloqueado a este usuario." };
      }
      return { error: `Error al bloquear: ${insertError.message}` };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al bloquear." };
  }
}

/**
 * Reports a user for safety/moderation review.
 */
export async function reportUser(data: {
  reportedId: string;
  reason: string;
  details?: string;
  clubId?: string | null;
  eventId?: string | null;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  try {
    const { error: insertError } = await supabase
      .from("connect_reports")
      .insert({
        reporter_id: user.id,
        reported_id: data.reportedId,
        reason: data.reason,
        details: data.details || null,
        club_id: data.clubId || null,
        event_id: data.eventId || null
      });

    if (insertError) {
      return { error: `Error al enviar reporte: ${insertError.message}` };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al reportar." };
  }
}

/**
 * Updates the social credentials and biography of the authenticated user.
 */
export async function updateSocialProfile(data: {
  instagram?: string;
  tiktok?: string;
  bio?: string;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "No estás autenticado." };
  }

  try {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        social_instagram: data.instagram ? data.instagram.replace("@", "").trim() : null,
        social_tiktok: data.tiktok ? data.tiktok.replace("@", "").trim() : null,
        bio: data.bio || null
      })
      .eq("id", user.id);

    if (updateError) {
      return { error: `Error al actualizar perfil: ${updateError.message}` };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar perfil social." };
  }
}
