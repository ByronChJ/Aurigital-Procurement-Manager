'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Trash2, ShoppingCart } from 'lucide-react'
import { createRequestAction, getProductosCatalogo } from './actions'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/forms'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'


export default function NuevaSolicitudForm() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // CATÁLOGO DINÁMICO
    const [productosCatalogo, setProductosCatalogo] = useState<any[]>([])

    // Cargar catálogo al abrir el modal (o montar el componente)
    useEffect(() => {
        async function fetchCatalogo() {
            const data = await getProductosCatalogo()
            setProductosCatalogo(data)
        }
        fetchCatalogo()
    }, [])

    // ESTADO DEL CARRITO: maestro-detalle
    const [cartItems, setCartItems] = useState<any[]>([])
    const [selectedProductId, setSelectedProductId] = useState('')
    const [selectedQuantity, setSelectedQuantity] = useState<number>(1)

    // Calculando el total dinámico basado en el subtotal
    const granTotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0)

    // Agrega un producto al carrito
    const handleAddToCart = () => {
        if (!selectedProductId || selectedQuantity <= 0) return

        const product = productosCatalogo.find(p => p.id === selectedProductId)
        if (!product) return

        const newItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: selectedQuantity,
            subtotal: parseFloat((product.price * selectedQuantity).toFixed(2)) // subtotal calculado en front 
        }

        // Si ya existe, podríamos sumar la cantidad, o simplemente agregarlo como nuevo item. 
        // Para simplificar MVP, evitamos duplicados sumando cantidad.
        const existingItemIndex = cartItems.findIndex(i => i.id === newItem.id)
        if (existingItemIndex > -1) {
            const updatedCart = [...cartItems]
            updatedCart[existingItemIndex].quantity += newItem.quantity
            updatedCart[existingItemIndex].subtotal = updatedCart[existingItemIndex].quantity * updatedCart[existingItemIndex].price
            setCartItems(updatedCart)
        } else {
            setCartItems([...cartItems, newItem])
        }

        // Reset inputs
        setSelectedProductId('')
        setSelectedQuantity(1)
    }

    const handleRemoveFromCart = (id: string) => {
        setCartItems(cartItems.filter(item => item.id !== id))
    }

    // Función asíncrona para manejar el envío maestro-detalle
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (cartItems.length === 0) {
            setError('Debe agregar al menos un producto al carrito.')
            setLoading(false)
            return
        }

        const formData = new FormData(e.currentTarget)

        try {
            // Llamada al Server Action enviando la cabecera (formData) y detalle (cartItems)
            const result = await createRequestAction(formData, cartItems)

            if (result.error) {
                setError(result.error)
            } else {
                // Éxito: Cierra el modal, limpia estado
                setCartItems([])
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
            {/* Botón Cliente para abrir el Modal Interactivo */}
            <Button onClick={() => setIsOpen(true)}>
                <ShoppingCart size={18} className="mr-2" />
                Nueva Solicitud (Carrito)
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        {/* Cabecera del Modal */}
                        <div className="sticky top-0 bg-white dark:bg-gray-800 flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 z-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Solicitud</h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Formulario que envía Cabecera y ejecuta Action */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* --- SECCIÓN MAESTRO (Cabecera) --- */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="title" className="mb-1 block">Título de Solicitud</Label>
                                    <Input id="title" name="title" required placeholder="Ej: Renovación de Equipos Administrativos" />
                                </div>
                                <div>
                                    <Label htmlFor="description" className="mb-1 block">Justificación General</Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        required rows={2}
                                        placeholder="Se necesitan renovar los equipos porque fallan..."
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* --- SECCIÓN DETALLE (Catálogo y Carrito) --- */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Agregar Productos (Detalle)</h3>

                                <div className="flex items-end gap-3 flex-wrap">
                                    <div className="flex-1 min-w-[200px]">
                                        <Label className="mb-1 block">Seleccionar Producto</Label>
                                        <select
                                            value={selectedProductId}
                                            onChange={(e) => setSelectedProductId(e.target.value)}
                                            className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Elige un producto del catálogo --</option>
                                            {productosCatalogo.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} - ${parseFloat(p.price).toFixed(2)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <Label className="mb-1 block">Cantidad</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={selectedQuantity}
                                            onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <Button type="button" onClick={handleAddToCart} variant="outline" className="h-10">
                                        <Plus size={16} className="mr-2" /> Agregar
                                    </Button>
                                </div>

                                {/* Tabla Visual del Carrito */}
                                {cartItems.length > 0 && (
                                    <div className="mt-4 border rounded-md overflow-hidden dark:border-gray-700 bg-white dark:bg-gray-900">
                                        <Table>
                                            <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                                <TableRow>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead className="text-right">Precio Unit.</TableHead>
                                                    <TableHead className="text-center">Cant.</TableHead>
                                                    <TableHead className="text-right">Subtotal</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {cartItems.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium text-gray-800 dark:text-gray-200">{item.name}</TableCell>
                                                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                                        <TableCell className="text-right font-semibold text-blue-600 dark:text-blue-400">
                                                            ${item.subtotal.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <button type="button" onClick={() => handleRemoveFromCart(item.id)} className="text-red-500 hover:text-red-700 transition p-1">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-gray-50 dark:bg-gray-800 font-bold">
                                                    <TableCell colSpan={3} className="text-right text-gray-900 dark:text-white">GRAN TOTAL:</TableCell>
                                                    <TableCell className="text-right text-green-600 dark:text-green-400 font-bold text-lg">
                                                        ${granTotal.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>

                            {/* Alerta de Error General */}
                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 p-3 rounded-md border border-red-200 dark:border-red-800">
                                    {error}
                                </p>
                            )}

                            {/* --- BOTONERA DE ACCIÓN --- */}
                            <div className="sticky bottom-0 bg-white dark:bg-gray-800 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 pb-2">
                                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                                {/* El submit envía tanto el FormData (cabecera) que lee la función, como el carrito por array */}
                                <Button type="submit" disabled={loading || cartItems.length === 0} className="min-w-[150px]">
                                    {loading ? 'Procesando...' : 'Enviar Solicitud'}
                                </Button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
