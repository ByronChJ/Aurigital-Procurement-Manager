import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Inicializando el cliente de Supabase para su uso en componentes de servidor (backend)
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Leyendo las cookies actuales para mantener la sesión
                getAll() {
                    return cookieStore.getAll()
                },
                // Configurando cookies nuevas o actualizadas
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Se ignora el error si se intenta setear desde un Server Component
                    }
                },
            },
        }
    )
}
