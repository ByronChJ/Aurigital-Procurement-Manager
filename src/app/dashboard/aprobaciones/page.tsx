import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getBandejaAprobaciones } from '@/app/dashboard/actions'
import { AprobacionActions } from './AprobacionActions'
import DetalleSolicitudModal from '@/app/dashboard/DetalleSolicitudModal'
import { NotificacionesDropdown } from '@/components/ui/NotificacionesDropdown'

export default async function AprobacionesPage() {
    // 1. Conexión segura en el Server Component
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // 2. Verificación de permisos de usuario
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    // Si es comprador, no debería estar intentando aprobar: Forzamos redirección back al dashboard regular.
    if (!profile || profile.role === 'comprador') {
        return redirect('/dashboard')
    }

    // 3. Obtenemos las solicitudes que caen dentro del filtro del rol que hace la llamada
    const requests: any[] = await getBandejaAprobaciones()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Navbar Exclusiva para la Bandeja de Aprobaciones */}
            <nav className="border-b bg-white dark:bg-gray-800 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <a href="/dashboard" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition group flex items-center gap-2">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-semibold">Regresar</span>
                    </a>
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
                    <h1 className="text-lg md:text-xl font-bold dark:text-white flex items-center gap-2">
                        <span className="bg-blue-600 text-white p-1.5 rounded-md text-xs">J/F</span>
                        Bandeja de Aprobaciones
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mr-2">
                        {profile.full_name} <span className="text-gray-400 dark:text-gray-500 font-normal">({profile.role.replace('_', ' ').toUpperCase()})</span>
                    </span>

                    {/* Componente Interactivo de Notificaciones */}
                    <NotificacionesDropdown />
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* Indicaciones Claves sobre el Rol del Modulo */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Solicitudes Pendientes de tu Revisión</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Como <strong className="text-gray-700 dark:text-gray-300 capitalize">{profile.role.replace('_', ' ')}</strong>, aquí aparecen las solicitudes encoladas a la espera de tu dictamen técnico o presupuestal según tu límite de autoridad.
                    </p>
                </div>

                {/* Tabla de Aprobaciones */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800/80">
                            <TableRow>
                                <TableHead className="w-[180px]">Solicitante</TableHead>
                                <TableHead>Asunto (Título)</TableHead>
                                <TableHead className="text-right">Monto Estimado</TableHead>
                                <TableHead className="text-center w-[120px]">Fecha</TableHead>
                                <TableHead className="w-[100px] text-center">Detalles</TableHead>
                                <TableHead className="w-[140px] text-center">Revisión</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Rendereo condicional si el array está vacío, es decorado tipo Inbox Zero */}
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="p-4 bg-green-50 rounded-full dark:bg-green-900/20 text-green-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                                            </div>
                                            <p className="font-medium text-gray-700 dark:text-gray-300">¡Bandeja Limpia!</p>
                                            <p className="text-sm">No tienes solicitudes pendientes por procesar a la fecha.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                // Mapeo de solicitudes que le corresponden 
                                requests.map((req: any) => (
                                    <TableRow key={req.id} className="group relative">
                                        <TableCell>
                                            <div className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                                                {/* Leemos la relacion a perfiles para saber quién creó el requistion */}
                                                {req.profiles?.full_name}
                                            </div>
                                            <div className="text-xs text-gray-500 uppercase flex items-center gap-1">
                                                {req.profiles?.department || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-gray-900 dark:text-white truncate max-w-[300px]" title={req.title}>
                                                {req.title}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[300px]">
                                                {req.description}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
                                            ${Number(req.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-center text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DetalleSolicitudModal
                                                requestId={req.id}
                                                title={req.title}
                                                total={Number(req.amount)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center align-middle">
                                            {/* Inclusión del Componente Cliente de Actions que se encarga de Aprobar/Revolver la base de datos de manera atómica */}
                                            <AprobacionActions requestId={req.id} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

            </main>
        </div>
    )
}
