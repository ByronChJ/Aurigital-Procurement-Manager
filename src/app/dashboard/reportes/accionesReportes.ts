'use server'

import { createClient } from '@/lib/supabase/server'

// 1. Obtener Métricas del Dashboard (Por Estado y Monto de Aprobadas)
export async function getMetricasDashboard() {
    const supabase = await createClient()

    // Verificamos permisos (solo jefe o financieros)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // Traemos solicitudes con información del departamento del autor (vía join con profiles)
    const { data: requests, error } = await supabase
        .from('requests')
        .select('status, amount, created_at, profiles ( department )')
        
    if (error) {
        console.error('Error al obtener métricas:', error)
        return { error: error.message }
    }

    // Calculamos agrupaciones
    let aprobadas = 0
    let rechazadas = 0
    let pendientes = 0
    let montoTotalAprobado = 0
    const gastoPorDeptoMap: Record<string, number> = {}

    requests?.forEach(req => {
        const depto = (req.profiles as any)?.department || 'Sin Depto'

        if (req.status === 'aprobado') {
            aprobadas++
            montoTotalAprobado += Number(req.amount)
            
            // Acumulamos gasto por departamento
            gastoPorDeptoMap[depto] = (gastoPorDeptoMap[depto] || 0) + Number(req.amount)
        } else if (req.status === 'rechazado') {
            rechazadas++
        } else if (req.status.includes('pendiente')) {
            pendientes++
        }
    })

    // Convertimos el mapa de gastos a un array compatible con Recharts Pie
    const gastoPorDepto = Object.entries(gastoPorDeptoMap).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
    }))

    return {
        aprobadas,
        rechazadas,
        pendientes,
        montoTotalAprobado,
        total: requests?.length || 0,
        gastoPorDepto
    }
}

// 2. Obtener Logs de Auditoría (Con Filtros Avanzados)
export async function getLogsAuditoria(
    fechaInicio?: string, 
    fechaFin?: string, 
    accion?: string, 
    usuarioNombre?: string
) {
    const supabase = await createClient()

    let query = supabase
        .from('audit_logs')
        .select(`
            id,
            action,
            timestamp,
            profiles!inner ( full_name, role ),
            requests ( title )
        `)
        .order('timestamp', { ascending: false })

    // Agregamos filtros si las fechas existen (lógica SQL Between)
    if (fechaInicio) {
        query = query.gte('timestamp', `${fechaInicio}T00:00:00Z`)
    }
    if (fechaFin) {
        query = query.lte('timestamp', `${fechaFin}T23:59:59Z`)
    }

    // Filtro por tipo de acción
    if (accion && accion !== 'todas') {
        query = query.eq('action', accion)
    }

    // Filtro por nombre de usuario (usando !inner join para filtrar por tabla relacionada)
    if (usuarioNombre) {
        query = query.ilike('profiles.full_name', `%${usuarioNombre}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error obteniendo auditoría:', error)
        return []
    }

    return data || []
}
