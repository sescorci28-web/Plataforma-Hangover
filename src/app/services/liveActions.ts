"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface OrderItemPayload {
  id: string;
  quantity: number;
  price: number;
}

/**
 * Validates if the current user is authenticated.
 */
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("No autenticado. Por favor inicia sesión.");
  }
  return { user, supabase };
}

/**
 * Validates if the current user is a provider or admin.
 */
async function validateProviderOrAdmin() {
  const { user, supabase } = await getAuthenticatedUser();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    throw new Error("No autorizado. Acción reservada para staff.");
  }
  return { user, supabase };
}

/**
 * Sends a live order from a client table.
 */
export async function sendLiveOrder(
  clubId: string,
  tableId: string,
  items: OrderItemPayload[]
) {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    if (!items || items.length === 0) {
      return { error: "El carrito está vacío." };
    }

    // 1. Resolve table_id (could be table UUID or table number)
    let resolvedTableId = "";
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(tableId)) {
      resolvedTableId = tableId;
    } else {
      const tableNumber = tableId.trim();
      const { data: tableData, error: findTableError } = await supabase
        .from("club_tables")
        .select("id")
        .eq("club_id", clubId)
        .eq("table_number", tableNumber)
        .maybeSingle();

      if (findTableError) {
        console.error("Error finding table:", findTableError);
        return { error: `Error al buscar la mesa: ${findTableError.message}` };
      }

      if (tableData) {
        resolvedTableId = tableData.id;
      } else {
        const { data: newTable, error: createTableError } = await supabase
          .from("club_tables")
          .insert({
            club_id: clubId,
            table_number: tableNumber,
            active: true
          })
          .select("id")
          .single();

        if (createTableError || !newTable) {
          console.error("Error creating table:", createTableError);
          return { error: `Error al registrar la mesa: ${createTableError?.message || "Error desconocido"}` };
        }
        resolvedTableId = newTable.id;
      }
    }

    // 2. Check if there is an active session ('open') for this user at this table
    let { data: session, error: sessionError } = await supabase
      .from("live_sessions")
      .select("id")
      .eq("club_id", clubId)
      .eq("table_id", resolvedTableId)
      .eq("user_id", user.id)
      .eq("status", "open")
      .maybeSingle();

    if (sessionError) {
      console.error("Error checking live session:", sessionError);
      return { error: `Error de sesión: ${sessionError.message}` };
    }

    let sessionId = session?.id;

    // 3. If no session is open, create a new one
    if (!sessionId) {
      const { data: newSession, error: createSessionError } = await supabase
        .from("live_sessions")
        .insert({
          club_id: clubId,
          table_id: resolvedTableId,
          user_id: user.id,
          status: "open",
          total_amount: 0.00
        })
        .select("id")
        .single();

      if (createSessionError || !newSession) {
        console.error("Error creating live session:", createSessionError);
        return { error: `No fue posible iniciar una sesión en mesa: ${createSessionError?.message || "Error desconocido"}` };
      }
      sessionId = newSession.id;
    }

    // 3. Insert the live order in 'pending' status
    const { data: order, error: orderError } = await supabase
      .from("live_orders")
      .insert({
        session_id: sessionId,
        status: "pending"
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Error creating live order:", orderError);
      return { error: `Error al generar la comanda: ${orderError.message}` };
    }

    const orderId = order.id;

    // 4. Map and insert order items
    const orderItems = items.map((item) => ({
      order_id: orderId,
      menu_item_id: item.id,
      quantity: item.quantity,
      price_at_order: item.price
    }));

    const { error: itemsError } = await supabase
      .from("live_order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error inserting order items:", itemsError);
      // Attempt to clean up the order
      await supabase.from("live_orders").delete().eq("id", orderId);
      return { error: `Error al registrar los productos de la comanda: ${itemsError.message}` };
    }

    // Revalidate club page and account view
    revalidatePath("/discotecas/[slug]", "page");
    revalidatePath("/discotecas/[slug]/mi-cuenta", "page");

    return { success: true, orderId };
  } catch (err: any) {
    console.error("Unhandled error in sendLiveOrder:", err);
    return { error: err.message || "Ocurrió un error inesperado al enviar el pedido." };
  }
}

/**
 * Confirm item receipt by the client (updating status from 'delivered_by_staff' to 'confirmed').
 * It also sums the confirmed order values to the live_sessions total_amount.
 */
export async function confirmLiveOrderItemReceipt(orderId: string) {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    // 1. Fetch order, session and items, validating ownership
    const { data: order, error: orderFetchError } = await supabase
      .from("live_orders")
      .select("id, status, session_id, live_sessions!inner(user_id, club_id)")
      .eq("id", orderId)
      .single();

    if (orderFetchError || !order) {
      console.error("Error fetching order for receipt confirmation:", orderFetchError);
      return { error: "El pedido especificado no existe." };
    }

    // Type casting because of inner join select
    const sessionOwnerId = (order.live_sessions as any)?.user_id;
    if (sessionOwnerId !== user.id) {
      return { error: "No autorizado. Este pedido no te pertenece." };
    }

    if (order.status !== "delivered_by_staff") {
      return { error: `No se puede confirmar la recepción. El estado actual es '${order.status}'.` };
    }

    // 2. Update order status to 'confirmed'
    const { error: updateError } = await supabase
      .from("live_orders")
      .update({ status: "confirmed" })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order status to confirmed:", updateError);
      return { error: `Error al actualizar estado del pedido: ${updateError.message}` };
    }

    // 3. Recalculate session total amount based on ALL confirmed orders
    const sessionId = order.session_id;

    // Fetch all confirmed orders in this session
    const { data: confirmedOrders, error: fetchConfirmedError } = await supabase
      .from("live_orders")
      .select("id")
      .eq("session_id", sessionId)
      .eq("status", "confirmed");

    if (fetchConfirmedError) {
      console.error("Error fetching confirmed orders for session:", fetchConfirmedError);
      return { error: "Error al recalcular el total de la cuenta." };
    }

    let totalSum = 0;
    if (confirmedOrders && confirmedOrders.length > 0) {
      const confirmedOrderIds = confirmedOrders.map((o) => o.id);
      
      // Fetch all items from these confirmed orders
      const { data: items, error: fetchItemsError } = await supabase
        .from("live_order_items")
        .select("quantity, price_at_order")
        .in("order_id", confirmedOrderIds);

      if (fetchItemsError) {
        console.error("Error fetching confirmed order items:", fetchItemsError);
        return { error: "Error al sumar los productos confirmados." };
      }

      totalSum = (items || []).reduce(
        (sum, item) => sum + Number(item.price_at_order) * item.quantity,
        0
      );
    }

    // 4. Update the live session total_amount
    const { error: sessionUpdateError } = await supabase
      .from("live_sessions")
      .update({ total_amount: totalSum })
      .eq("id", sessionId);

    if (sessionUpdateError) {
      console.error("Error updating live session total amount:", sessionUpdateError);
      return { error: `Error al actualizar el acumulado de la sesión: ${sessionUpdateError.message}` };
    }

    revalidatePath("/discotecas/[slug]/mi-cuenta", "page");
    return { success: true };
  } catch (err: any) {
    console.error("Unhandled error in confirmLiveOrderItemReceipt:", err);
    return { error: err.message || "Ocurrió un error inesperado al confirmar el pedido." };
  }
}

/**
 * Updates the status of a live order (staff action).
 */
export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const { supabase } = await validateProviderOrAdmin();

    const allowedStatuses = ["pending", "preparing", "delivered_by_staff", "confirmed", "cancelled"];
    if (!allowedStatuses.includes(newStatus)) {
      return { error: `Estado '${newStatus}' no es válido.` };
    }

    const { error: updateError } = await supabase
      .from("live_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating live order status:", updateError);
      return { error: `Error al actualizar el estado del pedido: ${updateError.message}` };
    }

    revalidatePath("/discotecas/[slug]/mi-cuenta", "page");
    return { success: true };
  } catch (err: any) {
    console.error("Unhandled error in updateOrderStatus:", err);
    return { error: err.message || "Ocurrió un error inesperado." };
  }
}
