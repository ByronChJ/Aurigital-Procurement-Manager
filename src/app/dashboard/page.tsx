import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/login/actions'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import NuevaSolicitudForm from './NuevaSolicitudForm'
import DetalleSolicitudModal from './DetalleSolicitudModal'
import { AnularSolicitudButton } from './AnularSolicitudButton'
import { NotificacionesDropdown } from '@/components/ui/NotificacionesDropdown'

export default async function DashboardPage() {
    // Conectando a Supabase para verificar si el usuario tiene sesión activa
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Redirigir al login si no está autenticado
    if (!user) {
        return redirect('/login')
    }

    // Petición a la base de datos para obtener el perfil y el rol del usuario
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, department')
        .eq('id', user.id)
        .single()

    // Petición de las solicitudes relacionadas al usuario 
    const { data: requests } = await supabase
        .from('requests')
        .select('*')
        .neq('status', 'anulado')
        .order('created_at', { ascending: false })

    // Cálculo rápido de KPIs para el Dashboard
    const totalAmount = requests?.reduce((sum, req) => sum + Number(req.amount), 0) || 0;
    const pendingCount = requests?.filter(req => req.status.includes('pendiente')).length || 0;
    const approvedCount = requests?.filter(req => req.status === 'aprobado').length || 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

            {/* Navbar Superior del Dashboard */}
            <nav className="border-b bg-white dark:bg-gray-800 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white p-2 rounded-lg font-bold">A</div>
                    <span className="text-xl font-bold dark:text-white">Aurigital</span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">
                        {profile?.full_name} ({profile?.role})
                    </span>

                    {/* Link a Aprobaciones si el rol es superior */}
                    {profile?.role !== 'comprador' && (
                        <a href="/dashboard/aprobaciones" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline mr-4">
                            Ir a Bandeja de Aprobaciones
                        </a>
                    )}

                    {/* Componente Dropdown Interactio de Notificaciones */}
                    <NotificacionesDropdown />

                    {/* Botón Salir utilizando server action de cerrar sesión */}
                    <form action={logout}>
                        <Button variant="ghost" className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition p-2">
                            <LogOut size={20} />
                        </Button>
                    </form>
                </div>
            </nav>

            {/* Contenido Principal */}
            <main className="max-w-7xl mx-auto px-6 py-8">

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Solicitudes</h1>

                    {/* Formulario Cliente interactivo Maestro-Detalle */}
                    <NuevaSolicitudForm />
                </div>

                {/* Tarjetas KPI (Indicadores Clave de Rendimiento) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Solicitado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold dark:text-white">${totalAmount.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">{pendingCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Aprobadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-500">{approvedCount}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Lista/Tabla de Solicitudes */}
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[80px] text-center">Detalle</TableHead>
                                <TableHead className="w-[100px] text-center">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                        No hay solicitudes registradas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests?.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium text-gray-900 dark:text-white">{req.title}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px] md:max-w-xs">{req.description}</div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            ${Number(req.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-gray-500 dark:text-gray-400">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                                                ${req.status.includes('pendiente') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' : ''}
                                                ${req.status === 'aprobado' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' : ''}
                                                ${req.status === 'rechazado' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500' : ''}
                                            `}>
                                                {req.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DetalleSolicitudModal
                                                requestId={req.id}
                                                title={req.title}
                                                total={Number(req.amount)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center align-middle">
                                            {/* El botón de Anular sólo renderiza si el status es 'pendiente_jefe' y el usuario actual es el dueño */}
                                            <AnularSolicitudButton
                                                requestId={req.id}
                                                currentUserId={user.id}
                                                ownerId={req.user_id}
                                                currentStatus={req.status}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>

            </main>
        </div>
    )
}
