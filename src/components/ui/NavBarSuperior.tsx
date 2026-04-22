import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificacionesDropdown } from '@/components/ui/NotificacionesDropdown'
import { logout } from '@/app/login/actions'

export function NavBarSuperior({ profile, tituloFlujo }: { profile: any, tituloFlujo: string }) {
    return (
        <nav className="border-b bg-white dark:bg-gray-800 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <div className="bg-blue-600 text-white px-2 py-1.5 rounded-md font-bold text-sm">
                    {profile?.role === 'jefe' ? 'JEF' : profile?.role?.includes('financiero') ? 'FIN' : 'USR'}
                </div>
                <h1 className="text-lg md:text-xl font-bold dark:text-white border-r pr-4 border-gray-200 dark:border-gray-700">
                    Aurigital
                </h1>

                {/* Submenú Navegador */}
                <div className="hidden md:flex items-center gap-3 ml-2 text-sm">
                    <a href="/dashboard" className="px-3 py-1.5 rounded-md font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        Inicio
                    </a>
                    {profile?.role !== 'comprador' && (
                        <>
                            <a href="/dashboard/aprobaciones" className="px-3 py-1.5 rounded-md font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                Aprobaciones
                            </a>
                            <a href="/dashboard/reportes" className="px-3 py-1.5 rounded-md font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                Reportes
                            </a>
                            <a href="/dashboard/auditoria" className="px-3 py-1.5 rounded-md font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                Auditoría (Logs)
                            </a>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
                    {profile?.full_name} <span className="text-gray-400 dark:text-gray-500 font-normal">({profile?.role})</span>
                </span>
                
                <NotificacionesDropdown />

                <form action={logout}>
                    <Button variant="ghost" className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition p-2">
                        <LogOut size={20} />
                    </Button>
                </form>
            </div>
        </nav>
    )
}
