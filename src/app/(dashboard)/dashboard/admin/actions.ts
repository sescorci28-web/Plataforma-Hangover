'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/types/database.types'

export async function updateUserRole(userId: string, newRole: UserRole) {
  const supabase = await createClient()

  // Verify authenticated session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No estás autenticado.' }
  }

  // Verify current user is admin
  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfileError || currentProfile?.role !== 'admin') {
    return { error: 'No autorizado. Solo los administradores pueden realizar esta acción.' }
  }

  // Prevent changing own role (to prevent accidental lockout)
  if (userId === user.id) {
    return { error: 'No puedes cambiar tu propio rol de administrador.' }
  }

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (updateError) {
      return { error: `No se pudo cambiar el rol: ${updateError.message}` }
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/user')
    revalidatePath('/dashboard/provider')
    
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al cambiar el rol de usuario.' }
  }
}
