'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper to generate a slug from name
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, "") // Remove non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+/, "") // Trim hyphens from start
    .replace(/-+$/, ""); // Trim hyphens from end
}

// Authentication & role validation helper
async function validateProvider() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "No estás autenticado.", user: null, supabase };
  }

  // Check provider role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    return { error: "No autorizado. Solo proveedores pueden gestionar discotecas.", user: null, supabase };
  }

  return { error: null, user, supabase };
}

export async function createClub(data: {
  name: string;
  city: string;
  description: string | null;
  banner_image: string | null;
  logo: string | null;
  address: string | null;
  instagram: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  website?: string | null;
  opening_hours: string | null;
  rating: number;
  active: boolean;
  cover_price: number;
  capacity?: number;
  amenities?: string[];
  club_type?: string;
  whatsapp?: string | null;
  price_range?: string;
  payment_methods?: string[];
  latitude?: number | null;
  longitude?: number | null;
  video_hero?: string | null;
  hero_image?: string | null;
  enabled_modules?: string[];
  modules_config?: Record<string, any>;
  status?: 'draft' | 'pending_review' | 'published' | 'paused' | 'archived';
  visibility?: 'public' | 'private' | 'unlisted';
  plan_type?: 'free' | 'pro' | 'enterprise';
  brand_id?: string | null;
}) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  const slug = slugify(data.name);
  const status = data.status || 'draft';
  const active = status === 'published' || status === 'paused';

  try {
    const { error: insertError } = await supabase
      .from("clubs")
      .insert({
        provider_id: user.id,
        owner_id: user.id,
        name: data.name,
        slug,
        city: data.city,
        description: data.description || null,
        banner_image: data.banner_image || null,
        logo: data.logo || null,
        address: data.address || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        tiktok: data.tiktok || null,
        website: data.website || null,
        opening_hours: data.opening_hours || null,
        rating: Number(data.rating) || 5.0,
        active,
        cover_price: Number(data.cover_price) || 0.00,
        capacity: Number(data.capacity) || 500,
        amenities: data.amenities || [],
        club_type: data.club_type || 'Discoteca',
        whatsapp: data.whatsapp || null,
        price_range: data.price_range || '$$',
        payment_methods: data.payment_methods || ["Efectivo", "Tarjeta"],
        latitude: data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : null,
        longitude: data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : null,
        video_hero: data.video_hero || null,
        hero_image: data.hero_image || null,
        enabled_modules: data.enabled_modules || ["reservations", "covers", "events", "qr"],
        modules_config: data.modules_config || {},
        status,
        visibility: data.visibility || 'public',
        plan_type: data.plan_type || 'free',
        brand_id: data.brand_id || null
      });

    if (insertError) {
      console.error("Insert club error:", insertError);
      return { error: `Error al crear la discoteca: ${insertError.message}` };
    }

    // Revalidate relevant pages
    revalidatePath("/discotecas");
    revalidatePath("/discotecas/[slug]", "page");
    revalidatePath("/dashboard/provider/clubs");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected insert club error:", err);
    return { error: err.message || "Ocurrió un error inesperado al registrar la discoteca." };
  }
}

export async function updateClub(
  id: string,
  data: {
    name: string;
    city: string;
    description: string | null;
    banner_image: string | null;
    logo: string | null;
    address: string | null;
    instagram: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    website?: string | null;
    opening_hours: string | null;
    rating: number;
    active: boolean;
    cover_price: number;
    capacity?: number;
    amenities?: string[];
    club_type?: string;
    whatsapp?: string | null;
    price_range?: string;
    payment_methods?: string[];
    latitude?: number | null;
    longitude?: number | null;
    video_hero?: string | null;
    hero_image?: string | null;
    enabled_modules?: string[];
    modules_config?: Record<string, any>;
    status?: 'draft' | 'pending_review' | 'published' | 'paused' | 'archived';
    visibility?: 'public' | 'private' | 'unlisted';
    plan_type?: 'free' | 'pro' | 'enterprise';
    brand_id?: string | null;
  }
) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  const slug = slugify(data.name);
  const status = data.status || 'draft';
  const active = status === 'published' || status === 'paused';

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    let query = supabase
      .from("clubs")
      .update({
        name: data.name,
        slug,
        city: data.city,
        description: data.description || null,
        banner_image: data.banner_image || null,
        logo: data.logo || null,
        address: data.address || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        tiktok: data.tiktok || null,
        website: data.website || null,
        opening_hours: data.opening_hours || null,
        rating: Number(data.rating) || 5.0,
        active,
        cover_price: Number(data.cover_price) || 0.00,
        capacity: Number(data.capacity) || 500,
        amenities: data.amenities || [],
        club_type: data.club_type || 'Discoteca',
        whatsapp: data.whatsapp || null,
        price_range: data.price_range || '$$',
        payment_methods: data.payment_methods || ["Efectivo", "Tarjeta"],
        latitude: data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : null,
        longitude: data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : null,
        video_hero: data.video_hero || null,
        hero_image: data.hero_image || null,
        enabled_modules: data.enabled_modules || ["reservations", "covers", "events", "qr"],
        modules_config: data.modules_config || {},
        status,
        visibility: data.visibility || 'public',
        plan_type: data.plan_type || 'free',
        brand_id: data.brand_id || null
      })
      .eq("id", id);

    if (!isAdmin) {
      query = query.eq("provider_id", user.id); // Ensure ownership
    }

    const { error: updateError } = await query;

    if (updateError) {
      console.error("Update club error:", updateError);
      return { error: `Error al actualizar la discoteca: ${updateError.message}` };
    }

    // Revalidate paths
    revalidatePath("/discotecas");
    revalidatePath("/discotecas/[slug]");
    revalidatePath("/dashboard/provider/clubs");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected update club error:", err);
    return { error: err.message || "Ocurrió un error inesperado al actualizar la discoteca." };
  }
}

export async function deleteClub(id: string) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Soft delete: update status to archived and set active to false
    let query = supabase
      .from("clubs")
      .update({
        status: 'archived',
        active: false
      })
      .eq("id", id);

    if (!isAdmin) {
      query = query.eq("provider_id", user.id); // Ensure ownership
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      console.error("Delete/Archive club error:", deleteError);
      return { error: `Error al archivar la discoteca: ${deleteError.message}` };
    }

    // Revalidate paths
    revalidatePath("/discotecas");
    revalidatePath("/discotecas/[slug]");
    revalidatePath("/dashboard/provider/clubs");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected delete/archive club error:", err);
    return { error: err.message || "Ocurrió un error inesperado al archivar la discoteca." };
  }
}

/**
 * Creates a club menu item.
 */
export async function createMenuItem(data: {
  club_id: string;
  category: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  active: boolean;
  featured: boolean;
  available: boolean;
}) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      const { data: club } = await supabase
        .from("clubs")
        .select("id")
        .eq("id", data.club_id)
        .eq("provider_id", user.id)
        .maybeSingle();

      if (!club) {
        return { error: "No tienes permiso para gestionar la carta de esta discoteca." };
      }
    }

    const { error: insertError } = await supabase
      .from("club_menu_items")
      .insert({
        club_id: data.club_id,
        category: data.category,
        name: data.name,
        description: data.description || null,
        price: Number(data.price) || 0,
        image_url: data.image_url || null,
        active: data.active,
        featured: data.featured,
        available: data.available
      });

    if (insertError) {
      console.error("Insert menu item error:", insertError);
      return { error: `Error al crear el producto: ${insertError.message}` };
    }

    revalidatePath("/discotecas/[slug]");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Ocurrió un error al crear el producto." };
  }
}

/**
 * Updates a club menu item.
 */
export async function updateMenuItem(
  id: string,
  data: {
    category: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    active: boolean;
    featured: boolean;
    available: boolean;
  }
) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    // First fetch the item to verify ownership of the associated club
    const { data: menuItem, error: fetchError } = await supabase
      .from("club_menu_items")
      .select("club_id")
      .eq("id", id)
      .single();

    if (fetchError || !menuItem) {
      return { error: "El producto no existe." };
    }

    if (!isAdmin) {
      const { data: club } = await supabase
        .from("clubs")
        .select("id")
        .eq("id", menuItem.club_id)
        .eq("provider_id", user.id)
        .maybeSingle();

      if (!club) {
        return { error: "No tienes permiso para actualizar este producto." };
      }
    }

    const { error: updateError } = await supabase
      .from("club_menu_items")
      .update({
        category: data.category,
        name: data.name,
        description: data.description || null,
        price: Number(data.price) || 0,
        image_url: data.image_url || null,
        active: data.active,
        featured: data.featured,
        available: data.available
      })
      .eq("id", id);

    if (updateError) {
      console.error("Update menu item error:", updateError);
      return { error: `Error al actualizar el producto: ${updateError.message}` };
    }

    revalidatePath("/discotecas/[slug]");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Ocurrió un error al actualizar el producto." };
  }
}

/**
 * Deletes a club menu item.
 */
export async function deleteMenuItem(id: string) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    // First fetch the item to verify ownership of the associated club
    const { data: menuItem, error: fetchError } = await supabase
      .from("club_menu_items")
      .select("club_id")
      .eq("id", id)
      .single();

    if (fetchError || !menuItem) {
      return { error: "El producto no existe o ya fue eliminado." };
    }

    if (!isAdmin) {
      const { data: club } = await supabase
        .from("clubs")
        .select("id")
        .eq("id", menuItem.club_id)
        .eq("provider_id", user.id)
        .maybeSingle();

      if (!club) {
        return { error: "No tienes permiso para eliminar este producto." };
      }
    }

    const { error: deleteError } = await supabase
      .from("club_menu_items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete menu item error:", deleteError);
      return { error: `Error al eliminar el producto: ${deleteError.message}` };
    }

    revalidatePath("/discotecas/[slug]");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Ocurrió un error al eliminar el producto." };
  }
}

/**
 * Creates a club service.
 */
export async function createClubService(data: {
  club_id: string;
  name: string;
  description: string;
  price: number | null;
  active: boolean;
}) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      const { data: club } = await supabase
        .from("clubs")
        .select("id")
        .eq("id", data.club_id)
        .eq("provider_id", user.id)
        .maybeSingle();

      if (!club) {
        return { error: "No tienes permiso para gestionar los servicios de esta discoteca." };
      }
    }

    const { error: insertError } = await supabase
      .from("club_services")
      .insert({
        club_id: data.club_id,
        name: data.name,
        description: data.description,
        price: data.price !== null ? Number(data.price) : null,
        active: data.active
      });

    if (insertError) {
      console.error("Insert service error:", insertError);
      return { error: `Error al crear el servicio: ${insertError.message}` };
    }

    revalidatePath("/discotecas/[slug]");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Ocurrió un error al crear el servicio." };
  }
}

/**
 * Updates a club service.
 */
export async function updateClubService(
  id: string,
  data: {
    name: string;
    description: string;
    price: number | null;
    active: boolean;
  }
) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    // First fetch the service to verify ownership of the associated club
    const { data: clubService, error: fetchError } = await supabase
      .from("club_services")
      .select("club_id")
      .eq("id", id)
      .single();

    if (fetchError || !clubService) {
      return { error: "El servicio no existe." };
    }

    if (!isAdmin) {
      const { data: club } = await supabase
        .from("clubs")
        .select("id")
        .eq("id", clubService.club_id)
        .eq("provider_id", user.id)
        .maybeSingle();

      if (!club) {
        return { error: "No tienes permiso para actualizar este servicio." };
      }
    }

    const { error: updateError } = await supabase
      .from("club_services")
      .update({
        name: data.name,
        description: data.description,
        price: data.price !== null ? Number(data.price) : null,
        active: data.active
      })
      .eq("id", id);

    if (updateError) {
      console.error("Update service error:", updateError);
      return { error: `Error al actualizar el servicio: ${updateError.message}` };
    }

    revalidatePath("/discotecas/[slug]");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Ocurrió un error al actualizar el servicio." };
  }
}

/**
 * Deletes a club service.
 */
export async function deleteClubService(id: string) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    // First fetch the service to verify ownership of the associated club
    const { data: clubService, error: fetchError } = await supabase
      .from("club_services")
      .select("club_id")
      .eq("id", id)
      .single();

    if (fetchError || !clubService) {
      return { error: "El servicio no existe o ya fue eliminado." };
    }

    if (!isAdmin) {
      const { data: club } = await supabase
        .from("clubs")
        .select("id")
        .eq("id", clubService.club_id)
        .eq("provider_id", user.id)
        .maybeSingle();

      if (!club) {
        return { error: "No tienes permiso para eliminar este servicio." };
      }
    }

    const { error: deleteError } = await supabase
      .from("club_services")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete service error:", deleteError);
      return { error: `Error al eliminar el servicio: ${deleteError.message}` };
    }

    revalidatePath("/discotecas/[slug]");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Ocurrió un error al eliminar el servicio." };
  }
}

export async function getClubPaymentSettings(clubId: string) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  try {
    // Check ownership or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      const { data: club } = await supabase
        .from("clubs")
        .select("id")
        .eq("id", clubId)
        .eq("provider_id", user.id)
        .maybeSingle();

      if (!club) {
        return { error: "No autorizado para ver la configuración financiera de este local." };
      }
    }

    // Select settings
    let { data: settings, error: selectError } = await supabase
      .from("club_payment_settings")
      .select("*")
      .eq("club_id", clubId)
      .maybeSingle();

    if (selectError) {
      console.error("Select payment settings error:", selectError);
      return { error: selectError.message };
    }

    // Auto-create if not exists
    if (!settings) {
      const { data: newSettings, error: insertError } = await supabase
        .from("club_payment_settings")
        .insert({
          club_id: clubId,
          online_payments_enabled: false,
          payment_gateway: "wompi",
          verification_status: "unverified",
          platform_commission: 5.0,
          revenue_today: 0.0,
          revenue_month: 0.0,
          revenue_accumulated: 0.0,
          commission_generated: 0.0,
          pending_settlement: 0.0
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("Insert default payment settings error:", insertError);
        return { error: insertError.message };
      }

      settings = newSettings;
    }

    return { settings };
  } catch (err: any) {
    console.error("Unexpected error in getClubPaymentSettings:", err);
    return { error: err.message || "Ocurrió un error inesperado." };
  }
}

export async function updateClubPaymentSettings(
  clubId: string,
  data: {
    online_payments_enabled: boolean;
    payment_gateway: string;
    bank_holder_name: string | null;
    bank_name: string | null;
    bank_account_type: string;
    bank_account_number: string | null;
    doc_type: string | null;
    doc_number: string | null;
    business_name: string | null;
    commercial_name: string | null;
  }
) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      // Check ownership
      const { data: club } = await supabase
        .from("clubs")
        .select("id")
        .eq("id", clubId)
        .eq("provider_id", user.id)
        .maybeSingle();

      if (!club) {
        return { error: "No autorizado para modificar este local." };
      }
    }

    // Fetch current settings to verify verification_status
    const { data: currentSettings } = await supabase
      .from("club_payment_settings")
      .select("verification_status")
      .eq("club_id", clubId)
      .maybeSingle();

    const verificationStatus = currentSettings?.verification_status || "unverified";

    // Rule: if not verified, cannot enable online payments
    let onlinePaymentsEnabled = data.online_payments_enabled;
    if (onlinePaymentsEnabled && verificationStatus !== "verified") {
      return { error: "No puedes activar pagos online si tu cuenta no está en estado verificado." };
    }

    const { error: updateError } = await supabase
      .from("club_payment_settings")
      .upsert({
        club_id: clubId,
        online_payments_enabled: onlinePaymentsEnabled,
        payment_gateway: data.payment_gateway || "wompi",
        bank_holder_name: data.bank_holder_name || null,
        bank_name: data.bank_name || null,
        bank_account_type: data.bank_account_type || "ahorros",
        bank_account_number: data.bank_account_number || null,
        doc_type: data.doc_type || null,
        doc_number: data.doc_number || null,
        business_name: data.business_name || null,
        commercial_name: data.commercial_name || null,
        updated_by: user.id
      }, {
        onConflict: 'club_id'
      });

    if (updateError) {
      console.error("Update payment settings error:", updateError);
      return { error: `Error al guardar configuración: ${updateError.message}` };
    }

    revalidatePath("/dashboard/provider/clubs");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in updateClubPaymentSettings:", err);
    return { error: err.message || "Ocurrió un error inesperado al guardar la configuración bancaria." };
  }
}

export async function getClubPayoutHistory(clubId: string) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      const { data: club } = await supabase
        .from("clubs")
        .select("id")
        .eq("id", clubId)
        .eq("provider_id", user.id)
        .maybeSingle();

      if (!club) {
        return { error: "No autorizado." };
      }
    }

    const { data: history, error: historyError } = await supabase
      .from("club_payout_history")
      .select("*")
      .eq("club_id", clubId)
      .order("settled_at", { ascending: false });

    if (historyError) {
      console.error("Get payout history error:", historyError);
      return { error: historyError.message };
    }

    return { history: history || [] };
  } catch (err: any) {
    return { error: err.message || "Ocurrió un error al obtener el historial de liquidaciones." };
  }
}

