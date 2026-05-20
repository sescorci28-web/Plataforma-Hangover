'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ProfileUpdateResult {
  success?: boolean
  error?: string
}

export async function updateProfile(formData: FormData): Promise<ProfileUpdateResult> {
  const supabase = await createClient()
  
  // Verify authenticated session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No estás autenticado.' }
  }

  const full_name = formData.get('full_name') as string
  const username = formData.get('username') as string
  const city = formData.get('city') as string
  const bio = formData.get('bio') as string
  const phone = formData.get('phone') as string
  const avatar_url = formData.get('avatar_url') as string

  // Validations
  if (!full_name || full_name.trim() === '') {
    return { error: 'El nombre completo es requerido.' }
  }

  if (!username || username.trim() === '') {
    return { error: 'El nombre de usuario es requerido.' }
  }

  // Format validation for username
  const cleanUsername = username.trim().toLowerCase()
  if (cleanUsername.length < 3) {
    return { error: 'El nombre de usuario debe tener al menos 3 caracteres.' }
  }

  if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
    return { error: 'El nombre de usuario solo puede contener letras minúsculas, números y guiones bajos (_).' }
  }

  try {
    // Check if username is already taken by another user
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .neq('id', user.id)
      .maybeSingle()

    if (checkError) {
      return { error: 'Error al verificar disponibilidad del nombre de usuario.' }
    }

    if (existingUser) {
      return { error: 'El nombre de usuario ya está ocupado por otra persona.' }
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: full_name.trim(),
        username: cleanUsername,
        city: city ? city.trim() : null,
        bio: bio ? bio.trim() : null,
        phone: phone ? phone.trim() : null,
        avatar_url: avatar_url ? avatar_url.trim() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      return { error: `No se pudo actualizar el perfil: ${updateError.message}` }
    }

    // Revalidate paths to refresh the cache
    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/user')
    revalidatePath('/dashboard/provider')
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/profile')
    
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado al actualizar tu perfil.' }
  }
}
