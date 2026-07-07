'use server'

import { createClient } from "@/lib/supabase/server";

export async function searchUniversal(queryText: string) {
  if (!queryText || queryText.trim().length < 2) {
    return {
      personas: [],
      proveedores: [],
      discotecas: [],
      eventos: [],
      servicios: []
    };
  }

  const supabase = await createClient();
  const cleanQuery = `%${queryText.trim()}%`;

  try {
    // 1. Query personas (profiles with role = 'user')
    const { data: personasData } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, city, role")
      .eq("role", "user")
      .or(`full_name.ilike.${cleanQuery},username.ilike.${cleanQuery},city.ilike.${cleanQuery}`)
      .limit(5);

    // 2. Query proveedores (profiles with role = 'provider')
    const { data: proveedoresData } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, city, role")
      .eq("role", "provider")
      .or(`full_name.ilike.${cleanQuery},username.ilike.${cleanQuery},city.ilike.${cleanQuery}`)
      .limit(5);

    // 3. Query clubs (discotecas)
    const { data: discotecasData } = await supabase
      .from("clubs")
      .select("id, name, city, rating, logo, slug, banner_image")
      .or(`name.ilike.${cleanQuery},city.ilike.${cleanQuery}`)
      .limit(5);

    // 4. Query events (eventos)
    const { data: eventosData } = await supabase
      .from("events")
      .select("id, title, event_date, location, image_url")
      .or(`title.ilike.${cleanQuery},location.ilike.${cleanQuery}`)
      .limit(5);

    // 5. Query services (servicios)
    const { data: serviciosData } = await supabase
      .from("services")
      .select(`
        id, 
        title, 
        price, 
        image_url, 
        slug, 
        category,
        base_city,
        provider:profiles!services_provider_id_fkey (
          full_name,
          city
        )
      `)
      .or(`title.ilike.${cleanQuery},category.ilike.${cleanQuery},base_city.ilike.${cleanQuery}`)
      .limit(5);

    return {
      personas: personasData || [],
      proveedores: proveedoresData || [],
      discotecas: discotecasData || [],
      eventos: eventosData || [],
      servicios: serviciosData || []
    };
  } catch (err) {
    console.error("Error in universal search:", err);
    return {
      personas: [],
      proveedores: [],
      discotecas: [],
      eventos: [],
      servicios: []
    };
  }
}
