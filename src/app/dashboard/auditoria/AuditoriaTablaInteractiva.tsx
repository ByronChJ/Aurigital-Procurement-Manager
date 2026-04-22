'use client'

import { useState, useEffect } from 'react'
import { getLogsAuditoria } from '../reportes/accionesReportes'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input, Label } from '@/components/ui/forms'
import { Button } from '@/components/ui/button'

export default function AuditoriaTablaInteractiva() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [usuarioNombre, setUsuarioNombre] = useState('')
    const [accion, setAccion] = useState('todas')

    // Función para invocar el Server Action responsable del SQL
    const fetchAuditoria = async () => {
        setLoading(true)
        try {
            // Se inyectan los parámetros al Server Action
            const data = await getLogsAuditoria(
                fechaInicio || undefined, 
                fechaFin || undefined,
                accion,
                usuarioNombre || undefined
            )
            setLogs(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Carga inicial sin filtros
    useEffect(() => {
        fetchAuditoria()
    }, [])

    return (
        <div className="space-y-6">
            {/* Controles de Filtro Visual (Client Side) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                    <div>
                        <Label className="mb-2 block text-xs font-semibold text-gray-500 uppercase">Buscar Usuario</Label>
                        <Input 
                            type="text" 
                            placeholder="Nombre del usuario..."
                            value={usuarioNombre} 
                            onChange={(e) => setUsuarioNombre(e.target.value)} 
                            className="w-full"
                        />
                    </div>
                    <div>
                        <Label className="mb-2 block text-xs font-semibold text-gray-500 uppercase">Tipo de Acción</Label>
                        <select
                            value={accion}
                            onChange={(e) => setAccion(e.target.value)}
                            className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="todas">-- Todas las acciones --</option>
                            <option value="creacion">Creación</option>
                            <option value="aprobacion">Aprobación</option>
                            <option value="rechazo">Rechazo</option>
                            <option value="anulacion_usuario">Anulación Usuario</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button 
                        variant="outline" 
                        onClick={() => { 
                            setFechaInicio(''); 
                            setFechaFin(''); 
                            setUsuarioNombre(''); 
                            setAccion('todas'); 
                        }} 
                    >
                        Limpiar Filtros
                    </Button>
                    <Button onClick={fetchAuditoria} className="min-w-[150px]" disabled={loading}>
                        {loading ? 'Consultando...' : 'Aplicar Filtros'}
                    </Button>
                </div>
            </div>

            {/* Renderizado de Tabla Inmutable */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800/80">
                        <TableRow>
                            <TableHead className="w-[180px]">Timestamp</TableHead>
                            <TableHead>Acción (Audit Trail)</TableHead>
                            <TableHead>Usuario Ejecutor</TableHead>
                            <TableHead>Rol Operativo</TableHead>
                            <TableHead>Identificador Solicitud</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                    Cargando registros criptográficos...
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                    No se encontraron eventos de auditoría en ese periodo.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                            ${log.action === 'aprobacion' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : ''}
                                            ${log.action === 'rechazo' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : ''}
                                            ${log.action === 'creacion' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : ''}
                                            ${log.action === 'anulacion_usuario' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' : ''}
                                        `}>
                                            {log.action.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-gray-900 dark:text-gray-100 font-medium">
                                        {log.profiles?.full_name}
                                    </TableCell>
                                    <TableCell className="text-gray-500 dark:text-gray-400 capitalize">
                                        {log.profiles?.role?.replace('_', ' ')}
                                    </TableCell>
                                    <TableCell className="text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                                        {log.requests?.title || 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
