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
  opening_hours: string | null;
  rating: number;
  active: boolean;
  cover_price: number;
}) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  const slug = slugify(data.name);

  try {
    const { error: insertError } = await supabase
      .from("clubs")
      .insert({
        provider_id: user.id,
        name: data.name,
        slug,
        city: data.city,
        description: data.description || null,
        banner_image: data.banner_image || null,
        logo: data.logo || null,
        address: data.address || null,
        instagram: data.instagram || null,
        opening_hours: data.opening_hours || null,
        rating: Number(data.rating) || 5.0,
        active: data.active,
        cover_price: Number(data.cover_price) || 0.00
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
    opening_hours: string | null;
    rating: number;
    active: boolean;
    cover_price: number;
  }
) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  const slug = slugify(data.name);

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
        opening_hours: data.opening_hours || null,
        rating: Number(data.rating) || 5.0,
        active: data.active,
        cover_price: Number(data.cover_price) || 0.00
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

    let query = supabase
      .from("clubs")
      .delete()
      .eq("id", id);

    if (!isAdmin) {
      query = query.eq("provider_id", user.id); // Ensure ownership
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      console.error("Delete club error:", deleteError);
      return { error: `Error al eliminar la discoteca: ${deleteError.message}` };
    }

    // Revalidate paths
    revalidatePath("/discotecas");
    revalidatePath("/discotecas/[slug]");
    revalidatePath("/dashboard/provider/clubs");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected delete club error:", err);
    return { error: err.message || "Ocurrió un error inesperado al eliminar la discoteca." };
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
