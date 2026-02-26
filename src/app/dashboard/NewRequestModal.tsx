'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/forms'

export default function NewRequestModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Función asíncrona para manejar el envío del formulario usando el Server Action
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)

        try {
            // Llamada al Server Action 'createRequest'
            const result = await createRequest(formData)

            if (result.error) {
                setError(result.error)
            } else {
                // Cierra el modal y limpia estado si es exitoso
                setIsOpen(false)
            }
        } catch (err) {
            setError('Ocurrió un error inesperado al guardar la solicitud.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Botón Cliente para abrir Modal, posicionado desde el dashboard usando Portal o inline */}
            <Button
                onClick={() => setIsOpen(true)}
            >
                <Plus size={18} className="mr-2" />
                Nueva Solicitud
            </Button>

            {/* Backdrop del Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">

                    {/* Contenedor del Modal */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Cabecera */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Solicitud de Compra</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Formulario que manda directo los datos requeridos */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* Título */}
                            <div>
                                <Label htmlFor="title" className="mb-1 block">
                                    Título / Concepto
                                </Label>
                                <Input
                                    id="title"
                                    name="title"
                                    type="text"
                                    required
                                    placeholder="Ej: Licencia Anual Adobe CC"
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <Label htmlFor="description" className="mb-1 block">
                                    Justificación
                                </Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    required
                                    rows={3}
                                    placeholder="Se requiere para el equipo de diseño UI en el proyecto X..."
                                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Monto */}
                            <div>
                                <Label htmlFor="amount" className="mb-1 block">
                                    Monto Estimado ($)
                                </Label>
                                <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    placeholder="600.00"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 p-3 rounded-md">
                                    {error}
                                </p>
                            )}

                            {/* Acciones */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="min-w-[120px]"
                                >
                                    {loading ? 'Guardando...' : 'Crear Solicitud'}
                                </Button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
