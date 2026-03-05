'use client'

import { useState } from 'react'
import { Check, X as XIcon } from 'lucide-react'
import { actualizarEstadoSolicitud } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'

export function AprobacionActions({ requestId }: { requestId: string }) {
    const [loading, setLoading] = useState(false)
    const [showRechazo, setShowRechazo] = useState(false)
    const [motivo, setMotivo] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Llama al Server Action para avanzar la solicitud de estado
    const handleAprobar = async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await actualizarEstadoSolicitud(requestId, 'aprobar')
            if (result.error) {
                setError(result.error)
            }
        } catch (err) {
            setError('Error al aprobar')
        } finally {
            setLoading(false)
        }
    }

    // Llama al Server Action para rechazar con un motivo obligatorio
    const handleRechazar = async () => {
        if (!motivo.trim()) {
            setError('El motivo es obligatorio')
            return
        }

        setLoading(true)
        setError(null)
        try {
            const result = await actualizarEstadoSolicitud(requestId, 'rechazar', motivo)
            if (result.error) {
                setError(result.error)
            } else {
                setShowRechazo(false)
            }
        } catch (err) {
            setError('Error al rechazar')
        } finally {
            setLoading(false)
        }
    }

    if (error) {
        return <div className="text-red-500 text-xs text-center">{error}</div>
    }

    return (
        <div className="flex gap-2 justify-center items-center min-h-[40px]">
            {showRechazo ? (
                <div className="flex flex-col gap-2 min-w-[200px] bg-white dark:bg-gray-800 p-2 rounded-md shadow-lg border dark:border-gray-700 absolute z-10 right-10">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Indique el motivo de rechazo:</p>
                    <textarea
                        className="text-sm p-2 rounded border border-gray-300 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Motivo de rechazo..."
                        rows={2}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setShowRechazo(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="button" variant="destructive" className="h-8 px-2 flex-1" onClick={handleRechazar} disabled={loading || !motivo.trim()}>
                            {loading ? 'Enviando...' : 'Confirmar Rechazo'}
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Botón de Aprobar */}
                    <Button
                        type="button"
                        variant="outline"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:border-green-900/50 dark:hover:bg-green-900/30 transition-colors"
                        onClick={handleAprobar}
                        disabled={loading}
                        title="Aprobar Solicitud"
                    >
                        <Check size={16} />
                    </Button>

                    {/* Botón de Rechazar (Despliega el mini modal local) */}
                    <Button
                        type="button"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/50 dark:hover:bg-red-900/30 transition-colors"
                        onClick={() => setShowRechazo(true)}
                        disabled={loading}
                        title="Rechazar Solicitud"
                    >
                        <XIcon size={16} />
                    </Button>
                </>
            )}
        </div>
    )
}
