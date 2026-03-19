'use client'

import { useState } from 'react'
import { Ban } from 'lucide-react'
import { anularSolicitudPropia } from './actions'
import { Button } from '@/components/ui/button'

export function AnularSolicitudButton({ requestId, currentUserId, ownerId, currentStatus }: { requestId: string, currentUserId: string, ownerId: string, currentStatus: string }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Ocultar botón si no está en el estado inicial permitido o si el usuario actual no es el dueño
    if (currentStatus !== 'pendiente_jefe' || currentUserId !== ownerId) {
        return null // Desaparece de la UI como dictan las reglas
    }

    const handleAnular = async () => {
        if (!confirm('¿Estás seguro de que deseas anular esta solicitud? Esta acción no se puede deshacer y requerirá hacer una nueva.')) return

        setLoading(true)
        setError(null)
        try {
            // Lógica asíncrona hacia el Server Action
            const result = await anularSolicitudPropia(requestId, currentUserId)
            if (result.error) {
                setError(result.error)
            }
        } catch (err) {
            setError('Error inesperado al intentar anular la solicitud.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center gap-1">
            <Button
                variant="outline"
                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition border-red-200 dark:border-red-900/50"
                onClick={handleAnular}
                disabled={loading}
                title="Anular Solicitud"
            >
                <Ban size={16} className="mr-1" />
                <span className="text-xs">{loading ? '...' : 'Anular'}</span>
            </Button>
            {error && <span className="text-[10px] text-red-500 max-w-[80px] leading-tight">{error}</span>}
        </div>
    )
}
