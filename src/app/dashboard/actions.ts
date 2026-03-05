'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRequestAction(formData: FormData, cartItems: any[]) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Usuario no autenticado')
    }

    // Extrayendo datos de la cabecera (maestro)
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    // Calculando el total dinámico basado en los subtotales del carrito
    const amount = cartItems.reduce((acc, item) => acc + item.subtotal, 0)

    if (!title || !description || amount <= 0 || cartItems.length === 0) {
        return { error: 'Datos de solicitud inválidos o carrito vacío' }
    }

    const { data: newRequest, error: requestError } = await supabase
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

    if (requestError) {
        return { error: requestError.message }
    }

    if (newRequest) {
        // Preparando los items del carrito para Bulk Insert
        const itemsToInsert = cartItems.map((item) => ({
            request_id: newRequest.id,
            product_id: item.id, // ID del producto del catálogo
            quantity: item.quantity,
            unit_price: item.price
        }))

        // Insertando el detalle (Request Items) mediante Bulk Insert
        const { error: itemsError } = await supabase
            .from('request_items')
            .insert(itemsToInsert)

        if (itemsError) {
            return { error: 'Error al insertar los productos de la solicitud: ' + itemsError.message }
        }

        // Insertando log en audit_logs indicando que originó una creación con relación maestro-detalle
        await supabase.from('audit_logs').insert([
            {
                request_id: newRequest.id,
                changed_by_user: user.id,
                action: 'creacion'
            }
        ])
    }

    revalidatePath('/dashboard')

    return { success: true }
}

// ----------------------------------------------------
// SPRINT 2: ACCIONES DE CATÁLOGO Y APROBACIONES
// ----------------------------------------------------

// 1. Obtener productos activos del catálogo
export async function getProductosCatalogo() {
    const supabase = await createClient()

    // Consulta a la BD por productos activos
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

    if (error) {
        console.error('Error obteniendo catálogo:', error)
        return []
    }

    return data || []
}

// 2. Obtener detalle de una solicitud (relación maestro-detalle con JOIN a products)
export async function getDetalleSolicitud(requestId: string) {
    const supabase = await createClient()

    // Hacemos un select a request_items y pedimos datos de la tabla relacionada (products)
    const { data, error } = await supabase
        .from('request_items')
        .select(`
            *,
            products (
                name,
                description
            )
        `)
        .eq('request_id', requestId)

    if (error) {
        console.error('Error obteniendo detalle de la solicitud:', error)
        return []
    }

    return data || []
}

// 3. Obtener Bandeja de Aprobaciones basado en el Rol
export async function getBandejaAprobaciones() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, id')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    const userRole = profile.role

    // Query base con JOIN a profiles para ver quién lo solicitó
    let query = supabase.from('requests').select(`
        *,
        profiles:user_id ( full_name, department )
    `).order('created_at', { ascending: false })

    // Filtros dinámicos según el ROL
    if (userRole === 'jefe') {
        // Jefe revisa las de sus subalternos que estén 'pendiente_jefe'
        const { data: subs } = await supabase.from('profiles').select('id').eq('boss_id', user.id)
        const subIds = subs?.map(s => s.id) || []

        if (subIds.length > 0) {
            query = query.eq('status', 'pendiente_jefe').in('user_id', subIds)
        } else {
            return [] // Sin subordinados, bandeja vacía
        }

    } else if (userRole.startsWith('financiero')) {
        // Financiero revisa 'pendiente_financiero' filtrando por monto
        query = query.eq('status', 'pendiente_financiero')

        if (userRole === 'financiero_1') {
            query = query.lte('amount', 1000)
        } else if (userRole === 'financiero_2') {
            query = query.gt('amount', 1000).lte('amount', 5000)
        } else if (userRole === 'financiero_3') {
            query = query.gt('amount', 5000)
        }
    } else {
        // El comprador no tiene bandeja de aprobador
        return []
    }

    const { data, error } = await query

    if (error) {
        console.error('Error al obtener la bandeja:', error)
        return []
    }

    return data || []
}

// 4. Actualizar Estado de la Solicitud (Aprobar/Rechazar) y auditar
export async function actualizarEstadoSolicitud(requestId: string, accion: 'aprobar' | 'rechazar', motivoRechazo: string | null = null) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile) return { error: 'Perfil no encontrado' }

    // Estado siguiente basado en la lógica de negocio
    let nuevoEstado = ''

    if (accion === 'rechazar') {
        nuevoEstado = 'rechazado'
    } else {
        if (profile.role === 'jefe') {
            nuevoEstado = 'pendiente_financiero'
        } else if (profile.role.startsWith('financiero')) {
            nuevoEstado = 'aprobado'
        } else {
            return { error: 'No tienes permisos de aprobador' }
        }
    }

    // Preparando objeto de actualización
    const updateData: any = {
        status: nuevoEstado,
        updated_at: new Date().toISOString()
    }

    if (motivoRechazo && accion === 'rechazar') {
        updateData.rejection_reason = motivoRechazo
    }

    // Actualizamos la BD devolviendo el UUID del autor original para la notificación
    const { data: updatedRequest, error: updateError } = await supabase
        .from('requests')
        .update(updateData)
        .eq('id', requestId)
        .select('user_id, title')
        .single()

    if (updateError) return { error: updateError.message }

    // Insertamos log de auditoría
    await supabase.from('audit_logs').insert([
        {
            request_id: requestId,
            changed_by_user: user.id,
            action: accion === 'aprobar' ? 'aprobacion' : 'rechazo'
        }
    ])

    // Enviar notificación (simulando correo) al autor original
    if (updatedRequest) {
        await supabase.from('notifications').insert([
            {
                user_id: updatedRequest.user_id,
                message: `Tu solicitud "${updatedRequest.title}" ha cambiado de estado a: ${nuevoEstado.replace('_', ' ').toUpperCase()}`
            }
        ]).select()
    }

    // Refrescamos vistas
    revalidatePath('/dashboard/aprobaciones')
    revalidatePath('/dashboard')

    return { success: true }
}

// 5. Anular Solicitud Propia
export async function anularSolicitudPropia(requestId: string, userId: string) {
    const supabase = await createClient()

    // Autenticación de seguridad extra
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) return { error: 'No autorizado' }

    // Verificamos primero el estado y propiedad
    const { data: request, error: fetchError } = await supabase
        .from('requests')
        .select('user_id, status')
        .eq('id', requestId)
        .single()

    if (fetchError || !request) return { error: 'Solicitud no encontrada' }

    // Validaciones estrictas: Ser dueño de la req y estar sólo en el primer nivel (pendiente jefe)
    if (request.user_id !== userId) return { error: 'No tienes permisos sobre esta solicitud' }
    if (request.status !== 'pendiente_jefe') return { error: 'Solo se pueden anular solicitudes en "Pendiente Jefe"' }

    // Ejecutando la actualización a anulado
    const { error: updateError } = await supabase
        .from('requests')
        .update({ status: 'anulado' })
        .eq('id', requestId)

    if (updateError) return { error: updateError.message }

    // Registro en bitácora de auditoría
    await supabase.from('audit_logs').insert([
        {
            request_id: requestId,
            changed_by_user: userId,
            action: 'anulacion_usuario'
        }
    ])

    revalidatePath('/dashboard')
    return { success: true }
}

// 6. Obtener Notificaciones
export async function getMisNotificaciones() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Leemos notificaciones de este usuario, más recientes primero
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error al obtener notificaciones:', error)
        return []
    }

    return data || []
}

// 7. Marcar Notificaciones como leídas
export async function marcarNotificacionesLeidas() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false)

        revalidatePath('/dashboard')
    }
}
