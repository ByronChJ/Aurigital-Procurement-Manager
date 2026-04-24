import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMetricasDashboard } from './accionesReportes'
import ReportesInteractivos from './ReportesInteractivos'
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <NavBarSuperior profile={profile} tituloFlujo="Módulo de Reportería" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inteligencia de Negocios Corporativa</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Visor unificado de aprobaciones financieras.</p>
                </div>

                {/* Componente Delegado interactivo (Client Component) */}
                <ReportesInteractivos initialMetricas={metricas} />

            </main>
        </div>
    )
}
