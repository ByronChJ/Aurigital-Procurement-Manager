'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { getMisNotificaciones, marcarNotificacionesLeidas } from '@/app/dashboard/actions'

export function NotificacionesDropdown() {
    const [notificaciones, setNotificaciones] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // Cargar notificaciones al montar
        getMisNotificaciones().then(data => setNotificaciones(data))
    }, [])

    const hasUnread = notificaciones.some(n => !n.is_read)

    const toggleDropdown = async () => {
        const newValue = !isOpen
        setIsOpen(newValue)

        // Si lo abrimos y hay no leídas, mandar la petición al backend para marcarlas como leídas
        if (newValue && hasUnread) {
            await marcarNotificacionesLeidas()
            // Limpia el badge en la UI inmediatamente
            setNotificaciones(prev => prev.map(n => ({ ...n, is_read: true })))
        }
    }

    return (
        <div className="relative">
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <Bell size={20} />
                {hasUnread && (
                    <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notificaciones.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                Sin notificaciones recientes.
                            </div>
                        ) : (
                            notificaciones.map(noti => (
                                <div key={noti.id} className={`p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!noti.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{noti.message}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        {new Date(noti.created_at).toLocaleDateString()} a las {new Date(noti.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
