'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor ingresa correo y contraseña.' }
  }

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Determine user role and redirect
  const userType = data.user?.user_metadata?.type || 'user'
  
  revalidatePath('/', 'layout')
  
  redirect(`/dashboard/${userType}`)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const type = formData.get('type') as string // 'user' or 'provider'

  if (!email || !password || !name) {
    return { error: 'Por favor completa todos los campos.' }
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        type,
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  
  redirect(`/dashboard/${type}`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
