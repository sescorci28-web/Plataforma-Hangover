'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/types/database.types'

export async function updateUserRole(userId: string, newRole: UserRole) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No estás autenticado.' }

  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (currentProfile?.role !== 'admin') return { error: 'No autorizado.' }
  if (userId === user.id) return { error: 'No puedes cambiar tu propio rol.' }

  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
  if (error) return { error: `No se pudo cambiar el rol: ${error.message}` }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No estás autenticado.' }

  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (currentProfile?.role !== 'admin') return { error: 'No autorizado.' }
  if (userId === user.id) return { error: 'No puedes eliminarte a ti mismo.' }

  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) return { error: `No se pudo eliminar el usuario: ${error.message}` }

  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No estás autenticado.' }

  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (currentProfile?.role !== 'admin') return { error: 'No autorizado.' }

  const { error } = await supabase.from('services').delete().eq('id', serviceId)
  if (error) return { error: `No se pudo eliminar el servicio: ${error.message}` }

  revalidatePath('/services')
  revalidatePath('/dashboard/admin/content')
  revalidatePath('/dashboard/provider')
  return { success: true }
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No estás autenticado.' }

  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (currentProfile?.role !== 'admin') return { error: 'No autorizado.' }

  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) return { error: `No se pudo eliminar el evento: ${error.message}` }

  revalidatePath('/events')
  revalidatePath('/dashboard/admin/content')
  revalidatePath('/dashboard/provider')
  return { success: true }
}

export async function deleteClub(clubId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No estás autenticado.' }

  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (currentProfile?.role !== 'admin') return { error: 'No autorizado.' }

  const { error } = await supabase.from('clubs').delete().eq('id', clubId)
  if (error) return { error: `No se pudo eliminar la discoteca: ${error.message}` }

  revalidatePath('/discotecas')
  revalidatePath('/dashboard/admin/content')
  revalidatePath('/dashboard/provider/clubs')
  return { success: true }
}
