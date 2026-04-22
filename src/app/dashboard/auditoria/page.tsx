import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuditoriaTablaInteractiva from './AuditoriaTablaInteractiva'
import { NavBarSuperior } from '@/components/ui/NavBarSuperior'

export default async function AuditoriaPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    // Control de Accesos: Solo los aprobadores / gerentes ven auditoría
    if (!profile || profile.role === 'comprador') {
        return redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <NavBarSuperior profile={profile} tituloFlujo="Módulo de Auditoría (Logs)" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bitácora de Eventos (Audit Trail)</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Historial inmutable de creaciones, autorizaciones, rechazos y anulaciones.
                    </p>
                </div>

                <div className="mb-6">
                    {/* Componente Delegado que llama a Server Actions y re-pinta la tabla */}
                    <AuditoriaTablaInteractiva />
                </div>
                
            </main>
        </div>
    )
}
