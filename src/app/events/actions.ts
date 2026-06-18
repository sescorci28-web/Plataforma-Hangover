'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Fetches the official event gallery.
 */
export async function getEventGallery(eventId: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("event_gallery_items")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return { success: true, items: data || [] };
  } catch (err: any) {
    console.error("Error fetching event gallery:", err.message);
    return { success: false, items: [], error: err.message };
  }
}

/**
 * Fetches the event updates/timeline.
 */
export async function getEventUpdates(eventId: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("event_updates")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, updates: data || [] };
  } catch (err: any) {
    console.error("Error fetching event updates:", err.message);
    return { success: false, updates: [], error: err.message };
  }
}

/**
 * Fetches the event lineup (artists, stage times).
 */
export async function getEventLineup(eventId: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("event_lineup")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return { success: true, lineup: data || [] };
  } catch (err: any) {
    console.error("Error fetching event lineup:", err.message);
    return { success: false, lineup: [], error: err.message };
  }
}

/**
 * Fetches the tickets purchased and manual RSVPs to build unique attendee list.
 */
export async function getEventAttendees(eventId: string) {
  const supabase = await createClient();
  try {
    // 1. Get from bookings (tickets sold)
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("user_id, profiles (id, full_name, avatar_url, city)")
      .eq("event_id", eventId)
      .in("status", ["confirmed", "completed"]);

    // 2. Get from manual RSVPs
    const { data: attendeesData } = await supabase
      .from("event_attendees")
      .select("user_id, profiles (id, full_name, avatar_url, city)")
      .eq("event_id", eventId)
      .eq("status", "going");

    // Merge lists by unique user_id
    const attendeesMap = new Map<string, any>();

    if (bookingsData) {
      bookingsData.forEach((b: any) => {
        if (b.profiles) {
          attendeesMap.set(b.user_id, b.profiles);
        }
      });
    }

    if (attendeesData) {
      attendeesData.forEach((a: any) => {
        if (a.profiles) {
          attendeesMap.set(a.user_id, a.profiles);
        }
      });
    }

    const uniqueAttendees = Array.from(attendeesMap.values());
    return { success: true, attendees: uniqueAttendees };
  } catch (err: any) {
    console.error("Error fetching event attendees:", err.message);
    return { success: false, attendees: [], error: err.message };
  }
}

/**
 * Fetches collaborative event memories.
 */
export async function getEventMemories(eventId: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("event_memories")
      .select(`
        *,
        user:profiles (full_name, avatar_url),
        reactions:event_memory_reactions (user_id),
        comments:event_memory_comments (
          id,
          comment,
          created_at,
          user:profiles (full_name, avatar_url)
        )
      `)
      .eq("event_id", eventId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return { success: true, memories: data || [] };
    }
    throw error;
  } catch (err: any) {
    try {
      const { data, error: fbErr } = await supabase
        .from("event_memories")
        .select("*, user:profiles (full_name, avatar_url)")
        .eq("event_id", eventId)
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (fbErr) throw fbErr;
      return { success: true, memories: data || [] };
    } catch (fbErr2: any) {
      console.error("Error fetching event memories:", fbErr2.message);
      return { success: false, memories: [], error: fbErr2.message };
    }
  }
}

/**
 * Add a new update for the event (restricted to owner).
 */
export async function addEventUpdate(eventId: string, title: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No estás autenticado." };

  try {
    const { error } = await supabase
      .from("event_updates")
      .insert({ event_id: eventId, title, description });

    if (error) throw error;

    // Log a notification for push preparation
    await supabase.from("event_notifications").insert({
      event_id: eventId,
      title: `Novedad: ${title}`,
      message: description,
      notification_type: 'update'
    });

    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Add a lineup item for the event (restricted to owner).
 */
export async function addEventLineupItem(
  eventId: string,
  artistName: string,
  performanceTime: string,
  description: string,
  imageUrl?: string,
  displayOrder: number = 0
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No estás autenticado." };

  try {
    const { error } = await supabase
      .from("event_lineup")
      .insert({
        event_id: eventId,
        artist_name: artistName,
        performance_time: performanceTime,
        description,
        image_url: imageUrl || null,
        display_order: displayOrder
      });

    if (error) throw error;

    // Log notification
    await supabase.from("event_notifications").insert({
      event_id: eventId,
      title: `Line-up confirmado: ${artistName}`,
      message: `Nuevo artista confirmado: ${artistName} tocará el ${performanceTime}.`,
      notification_type: 'lineup'
    });

    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Toggle interest or going status for an event.
 */
export async function toggleEventAttendance(eventId: string, status: 'going' | 'interested') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No estás autenticado." };

  try {
    // Check if entry exists
    const { data: existing } = await supabase
      .from("event_attendees")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      if (existing.status === status) {
        // Delete if clicked again (opt-out)
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        revalidatePath(`/events/${eventId}`);
        return { success: true, action: 'removed' };
      } else {
        // Update status
        const { error } = await supabase
          .from("event_attendees")
          .update({ status })
          .eq("id", existing.id);
        if (error) throw error;
        revalidatePath(`/events/${eventId}`);
        return { success: true, action: 'updated' };
      }
    } else {
      // Create profile if missing
      const { error } = await supabase
        .from("event_attendees")
        .insert({ event_id: eventId, user_id: user.id, status });
      if (error) throw error;
      revalidatePath(`/events/${eventId}`);
      return { success: true, action: 'added' };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Toggles an event in user's favorites.
 */
export async function toggleEventFavorite(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No estás autenticado." };

  try {
    const { data: existing } = await supabase
      .from("event_favorites")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("event_favorites")
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
      return { success: true, favorited: false };
    } else {
      const { error } = await supabase
        .from("event_favorites")
        .insert({ event_id: eventId, user_id: user.id });
      if (error) throw error;
      return { success: true, favorited: true };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Gets the favorite status of an event for the current user.
 */
export async function getEventFavoriteStatus(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { favorited: false };

  try {
    const { data } = await supabase
      .from("event_favorites")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    return { favorited: !!data };
  } catch (err) {
    return { favorited: false };
  }
}

/**
 * Gets or creates the chat room for an event.
 */
async function getOrCreateChatRoom(eventId: string) {
  const supabase = await createClient();
  try {
    const { data: room } = await supabase
      .from("event_chat_rooms")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (room) return room.id;

    // Create room
    const { data: newRoom, error } = await supabase
      .from("event_chat_rooms")
      .insert({ event_id: eventId })
      .select("id")
      .single();

    if (error) throw error;
    return newRoom.id;
  } catch (err: any) {
    console.error("Error get/create event chat room:", err.message);
    throw err;
  }
}

/**
 * Fetches messages for an event chat room.
 */
export async function getChatMessages(eventId: string) {
  const supabase = await createClient();
  try {
    const roomId = await getOrCreateChatRoom(eventId);
    const { data, error } = await supabase
      .from("event_chat_messages")
      .select("*, sender:profiles (full_name, avatar_url)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;
    return { success: true, messages: data || [] };
  } catch (err: any) {
    return { success: false, messages: [], error: err.message };
  }
}

/**
 * Sends a message to the event chat room.
 */
export async function sendChatMessage(eventId: string, message: string, mediaUrl?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No estás autenticado." };

  try {
    const roomId = await getOrCreateChatRoom(eventId);
    const { error } = await supabase
      .from("event_chat_messages")
      .insert({
        room_id: roomId,
        sender_id: user.id,
        message,
        media_url: mediaUrl || null
      });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Save user memories/collaboration items.
 */
export async function addEventMemory(eventId: string, url: string, mediaType: 'image' | 'video', title?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No estás autenticado." };

  try {
    const { error } = await supabase
      .from("event_memories")
      .insert({
        event_id: eventId,
        user_id: user.id,
        url,
        media_type: mediaType,
        title: title || null
      });

    if (error) throw error;
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Toggle user reaction for a memory.
 */
export async function toggleMemoryReaction(memoryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No estás autenticado." };

  try {
    const { data: existing } = await supabase
      .from("event_memory_reactions")
      .select("id")
      .eq("memory_id", memoryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("event_memory_reactions")
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
      return { success: true, reacted: false };
    } else {
      const { error } = await supabase
        .from("event_memory_reactions")
        .insert({ memory_id: memoryId, user_id: user.id });
      if (error) throw error;
      return { success: true, reacted: true };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Add a comment to a memory.
 */
export async function addMemoryComment(memoryId: string, commentText: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No estás autenticado." };

  if (!commentText.trim()) return { error: "El comentario no puede estar vacío." };

  try {
    const { data, error } = await supabase
      .from("event_memory_comments")
      .insert({
        memory_id: memoryId,
        user_id: user.id,
        comment: commentText.trim()
      })
      .select("*, user:profiles(full_name, avatar_url)")
      .single();

    if (error) throw error;
    return { success: true, comment: data };
  } catch (err: any) {
    return { error: err.message };
  }
}
