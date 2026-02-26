import { createBrowserClient } from '@supabase/ssr'

// Inicializando el cliente de Supabase para su uso en componentes de cliente (frontend)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
