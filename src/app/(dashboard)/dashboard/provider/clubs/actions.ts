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
        active: data.active
      });

    if (insertError) {
      console.error("Insert club error:", insertError);
      return { error: `Error al crear la discoteca: ${insertError.message}` };
    }

    // Revalidate relevant pages
    revalidatePath("/discotecas");
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
  }
) {
  const { error: authError, user, supabase } = await validateProvider();
  if (authError || !user) {
    return { error: authError };
  }

  const slug = slugify(data.name);

  try {
    const { error: updateError } = await supabase
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
        active: data.active
      })
      .eq("id", id)
      .eq("provider_id", user.id); // Ensure ownership

    if (updateError) {
      console.error("Update club error:", updateError);
      return { error: `Error al actualizar la discoteca: ${updateError.message}` };
    }

    // Revalidate paths
    revalidatePath("/discotecas");
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
    const { error: deleteError } = await supabase
      .from("clubs")
      .delete()
      .eq("id", id)
      .eq("provider_id", user.id); // Ensure ownership

    if (deleteError) {
      console.error("Delete club error:", deleteError);
      return { error: `Error al eliminar la discoteca: ${deleteError.message}` };
    }

    // Revalidate paths
    revalidatePath("/discotecas");
    revalidatePath("/dashboard/provider/clubs");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected delete club error:", err);
    return { error: err.message || "Ocurrió un error inesperado al eliminar la discoteca." };
  }
}
