'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    // Conectando a Supabase
    const supabase = await createClient()

    // Extrayendo datos del formulario
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validando credenciales con Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    // Si hay error, retornar al login con el mensaje de error
    if (error) {
        return redirect(`/login?message=${error.message}`)
    }

    // Redirigir al dashboard si fue exitoso
    redirect('/dashboard')
}

export async function logout() {
    // Conectando a Supabase
    const supabase = await createClient()

    // Cerrando la sesión del usuario
    await supabase.auth.signOut()

    // Redirigir al login
    redirect('/login')
}
