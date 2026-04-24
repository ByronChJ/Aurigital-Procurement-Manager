'use client'

import { useState } from 'react'
import { getMetricasDashboard } from './accionesReportes'
import ReporteGrafico from './ReporteGrafico'
import GastoDeptoPie from './GastoDeptoPie'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'

export default function ReportesInteractivos({ initialMetricas }: { initialMetricas: any }) {
    const [metricas, setMetricas] = useState(initialMetricas)
    const [loading, setLoading] = useState(false)
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')

    const fetchMetricas = async (inicio?: string, fin?: string) => {
        setLoading(true)
        try {
            const data = await getMetricasDashboard(inicio, fin)
            if (!data.error) {
                setMetricas(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleFiltrar = () => {
        fetchMetricas(fechaInicio || undefined, fechaFin || undefined)
    }

    const handleLimpiar = () => {
        setFechaInicio('')
        setFechaFin('')
        fetchMetricas(undefined, undefined)
    }

    const dataGrafico = [
        {
            name: 'Estado de Solicitudes',
            Aprobadas: metricas.aprobadas || 0,
            Rechazadas: metricas.rechazadas || 0,
            Pendientes: metricas.pendientes || 0
        }
    ]

    return (
        <div className="space-y-6">
            {/* Controles de Filtro Visual */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end max-w-2xl">
                    <div>
                        <Label className="mb-2 block text-xs font-semibold text-gray-500 uppercase">Desde Fecha</Label>
                        <Input 
                            type="date" 
                            value={fechaInicio} 
                            onChange={(e) => setFechaInicio(e.target.value)} 
                            className="w-full"
                        />
                    </div>
                    <div>
                        <Label className="mb-2 block text-xs font-semibold text-gray-500 uppercase">Hasta Fecha</Label>
                        <Input 
                            type="date" 
                            value={fechaFin} 
                            onChange={(e) => setFechaFin(e.target.value)} 
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 max-w-2xl">
                    <Button 
                        variant="outline" 
                        onClick={handleLimpiar} 
                    >
                        Limpiar Filtros
                    </Button>
                    <Button onClick={handleFiltrar} className="min-w-[150px]" disabled={loading}>
                        {loading ? 'Filtrando...' : 'Aplicar Filtros'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Financiero Aprobado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                            ${(metricas.montoTotalAprobado || 0).toFixed(2)}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Capital ya expedido sin bloqueos.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Volumen Operativo (Todas las Fases)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">
                            {metricas.total || 0}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Peticiones trazadas en el periodo.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Rendimiento de Aprobaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ReporteGrafico data={dataGrafico} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Distribución de Gasto por Depto.</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <GastoDeptoPie data={metricas.gastoPorDepto || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
