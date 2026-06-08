import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Redirigir a /onboarding por defecto para verificar el perfil tras registro/login
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Consultamos si el perfil ya completó el onboarding
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed, role")
          .eq("id", user.id)
          .single();

        if (profile) {
          if (profile.onboarding_completed) {
            // Si ya hizo onboarding, lo mandamos al dashboard correspondiente
            return NextResponse.redirect(`${origin}/dashboard`);
          } else {
            // Si no lo ha hecho, lo forzamos al onboarding
            return NextResponse.redirect(`${origin}/onboarding`);
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si hay un error, lo mandamos a login
  return NextResponse.redirect(`${origin}/login`);
}
