import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMetricasDashboard } from './accionesReportes'
import ReporteGrafico from './ReporteGrafico'
import GastoDeptoPie from './GastoDeptoPie'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NavBarSuperior } from '@/components/ui/NavBarSuperior'

export default async function ReportesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    // Solo directivos pueden ver reportes
    if (!profile || profile.role === 'comprador') {
        return redirect('/dashboard')
    }

    // Server Action para agarrar las matemáticas
    const metricas = await getMetricasDashboard()

    // Mapeo adaptativo para Recharts
    const dataGrafico = [
        {
            name: 'Estado de Solicitudes',
            Aprobadas: metricas.aprobadas || 0,
            Rechazadas: metricas.rechazadas || 0,
            Pendientes: metricas.pendientes || 0
        }
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <NavBarSuperior profile={profile} tituloFlujo="Módulo de Reportería" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inteligencia de Negocios Corporativa</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Visor unificado de aprobaciones financieras.</p>
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
                            <p className="text-sm text-gray-400 mt-2">Peticiones históricas trazadas.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rendimiento de Aprobaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Componente Delegado: Server Component -> Client Component */}
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

            </main>
        </div>
    )
}
