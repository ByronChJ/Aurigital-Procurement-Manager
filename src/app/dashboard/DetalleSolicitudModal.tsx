'use client'

import { useState } from 'react'
import { Eye, X } from 'lucide-react'
import { getDetalleSolicitud } from './actions'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function DetalleSolicitudModal({ requestId, title, total }: { requestId: string, title: string, total: number }) {
    const [isOpen, setIsOpen] = useState(false)
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Cargamos los datos del detalle (request_items y el JOIN con products) cuando el usuario abre el modal
    const handleOpen = async () => {
        setIsOpen(true)
        setLoading(true)
        const data = await getDetalleSolicitud(requestId)
        setItems(data)
        setLoading(false)
    }

    return (
        <>
            {/* Botón para Abrir Modal de Solo Lectura */}
            <Button variant="outline" onClick={handleOpen} className="h-8 px-2 group">
                <Eye size={16} className="text-gray-500 group-hover:text-blue-600 transition" />
            </Button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Cabecera */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalle de Solicitud</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Contenido (Tabla de Productos) */}
                        <div className="p-6 overflow-y-auto">
                            {loading ? (
                                <div className="text-center py-10 text-gray-500">Cargando productos...</div>
                            ) : items.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">No se encontraron productos para esta solicitud.</div>
                            ) : (
                                <div className="border rounded-md overflow-hidden dark:border-gray-700">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead>Descripción</TableHead>
                                                <TableHead className="text-right">Precio Unitario</TableHead>
                                                <TableHead className="text-center">Cantidad</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item) => (
                                                <TableRow key={item.id}>
                                                    {/* Relación con products: supabase devuelve { products: { name, description } } */}
                                                    <TableCell className="font-medium text-gray-900 dark:text-white">
                                                        {item.products?.name || 'Producto Desconocido'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-500 truncate max-w-[200px]">
                                                        {item.products?.description || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right font-medium text-blue-600 dark:text-blue-400">
                                                        ${Number(item.subtotal).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-gray-50 dark:bg-gray-800 font-bold">
                                                <TableCell colSpan={4} className="text-right text-gray-900 dark:text-white">GRAN TOTAL:</TableCell>
                                                <TableCell className="text-right text-green-600 dark:text-green-400 text-lg">
                                                    ${total.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
