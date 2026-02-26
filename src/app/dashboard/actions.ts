'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRequest(formData: FormData) {
    // Conectando a Supabase
    const supabase = await createClient()

    // Verificando usuario activo
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Usuario no autenticado')
    }

    // Extrayendo datos del formulario
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const amount = Number(formData.get('amount'))

    if (!title || !description || !amount || isNaN(amount) || amount <= 0) {
        return { error: 'Datos de solicitud inválidos' }
    }

    // Insertando la solicitud inicial, que por defecto queda "pendiente_jefe" (configurado en la DB)
    const { data: newRequest, error } = await supabase
        .from('requests')
        .insert([
            {
                user_id: user.id,
                title,
                description,
                amount
            }
        ])
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    // Insertar explícitamente el log inicial en audit_logs de creación 
    if (newRequest) {
        await supabase.from('audit_logs').insert([
            {
                request_id: newRequest.id,
                changed_by_user: user.id,
                action: 'creacion'
            }
        ])
    }

    // Revalida la página del dashboard para recargar los datos
    revalidatePath('/dashboard')

    return { success: true }
}
