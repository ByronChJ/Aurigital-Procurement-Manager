// Componentes cliente del dashboard: flujos de UI críticos
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AnularSolicitudButton } from '@/app/dashboard/AnularSolicitudButton'
import { AprobacionActions } from '@/app/dashboard/aprobaciones/AprobacionActions'
import DetalleSolicitudModal from '@/app/dashboard/DetalleSolicitudModal'
import { NotificacionesDropdown } from '@/components/ui/NotificacionesDropdown'
import GastoDeptoPie from '@/app/dashboard/reportes/GastoDeptoPie'
import AuditoriaTablaInteractiva from '@/app/dashboard/auditoria/AuditoriaTablaInteractiva'
import NuevaSolicitudForm from '@/app/dashboard/NuevaSolicitudForm'

const actions = jest.requireMock('@/app/dashboard/actions') as Record<string, jest.Mock>
const ar = jest.requireMock('@/app/dashboard/reportes/accionesReportes') as { getLogsAuditoria: jest.Mock }

jest.mock('lucide-react', () => {
  const I = (p: { 'data-name'?: string }) => <span data-name={p['data-name']} />
  return { Bell: (p: any) => I({ 'data-name': 'bell' }), Ban: I, Check: I, X: I, Eye: I, Plus: I, Trash2: I, ShoppingCart: I, LogOut: I, ArrowLeft: I }
})

jest.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div className="recharts-pie">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}))

jest.mock('@/app/dashboard/actions', () => ({
  anularSolicitudPropia: jest.fn().mockResolvedValue({}),
  actualizarEstadoSolicitud: jest.fn().mockResolvedValue({ success: true }),
  getDetalleSolicitud: jest.fn().mockResolvedValue([]),
  getMisNotificaciones: jest.fn().mockResolvedValue([{ id: 1, message: 'm', is_read: false, created_at: '2020-01-01T00:00:00Z' }]),
  marcarNotificacionesLeidas: jest.fn().mockResolvedValue(undefined),
  getProductosCatalogo: jest.fn().mockResolvedValue([{ id: 'p1', name: 'Prod', price: 10 }]),
  createRequestAction: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/app/dashboard/reportes/accionesReportes', () => ({
  getLogsAuditoria: jest.fn().mockResolvedValue([]),
}))

describe('AnularSolicitudButton', () => {
  it('no renderiza si no aplica', () => {
    const { container } = render(
      <AnularSolicitudButton requestId="r" currentUserId="u" ownerId="o" currentStatus="aprobado" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('muestra error si la acción devuelve error', async () => {
    const c = global.confirm
    global.confirm = () => true
    actions.anularSolicitudPropia.mockResolvedValue({ error: 'x' })
    render(<AnularSolicitudButton requestId="r" currentUserId="u" ownerId="u" currentStatus="pendiente_jefe" />)
    fireEvent.click(screen.getByRole('button', { name: /Anular/ }))
    await waitFor(() => expect(screen.getByText('x')).toBeInTheDocument())
    global.confirm = c
  })
})

describe('AprobacionActions', () => {
  it('muestra error si aprobar falla', async () => {
    actions.actualizarEstadoSolicitud.mockResolvedValue({ error: 'E' })
    render(<AprobacionActions requestId="a" />)
    const btns = screen.getAllByRole('button')
    fireEvent.click(btns[0])
    await waitFor(() => expect(screen.getByText('E')).toBeInTheDocument())
  })

  it('rechaza con motivo y cierra al éxito', async () => {
    actions.actualizarEstadoSolicitud.mockResolvedValue({ success: true })
    render(<AprobacionActions requestId="a" />)
    fireEvent.click(screen.getAllByRole('button')[1])
    const ta = document.querySelector('textarea')!
    fireEvent.change(ta, { target: { value: 'motivo' } })
    fireEvent.click(screen.getByText(/Confirmar Rechazo/))
    await waitFor(() => expect(actions.actualizarEstadoSolicitud).toHaveBeenCalled())
  })
})

describe('DetalleSolicitudModal', () => {
  it('muestra mensaje de lista vacía', async () => {
    actions.getDetalleSolicitud.mockResolvedValue([])
    render(<DetalleSolicitudModal requestId="a" title="T" total={2} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByText(/No se encontraron productos/)).toBeInTheDocument())
  })

  it('muestra fila de detalle con producto', async () => {
    actions.getDetalleSolicitud.mockResolvedValue([
      { id: 1, unit_price: 1, quantity: 2, subtotal: 2, products: { name: 'N', description: 'd' } },
    ])
    render(<DetalleSolicitudModal requestId="b" title="T" total={2} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByText('N')).toBeInTheDocument())
  })
})

describe('NotificacionesDropdown', () => {
  it('carga notificaciones al montar', async () => {
    render(<NotificacionesDropdown />)
    await waitFor(() => expect(actions.getMisNotificaciones).toHaveBeenCalled())
  })
})

describe('GastoDeptoPie', () => {
  it('vacío o con datos', () => {
    const { rerender } = render(<GastoDeptoPie data={[]} />)
    expect(screen.getByText(/No hay datos/)).toBeInTheDocument()
    rerender(<GastoDeptoPie data={[{ name: 'D', value: 100 }]} />)
    expect(document.querySelector('.recharts-pie')).toBeInTheDocument()
  })
})

describe('AuditoriaTablaInteractiva', () => {
  it('consulta, limpia y vuelve a filtrar', async () => {
    ar.getLogsAuditoria.mockResolvedValueOnce([
      { id: 1, action: 'aprobacion', timestamp: '2020-01-01', profiles: { full_name: 'A', role: 'jefe' }, requests: { title: 'R' } },
    ])
    render(<AuditoriaTablaInteractiva />)
    await waitFor(() => expect(ar.getLogsAuditoria).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Limpiar Filtros'))
    await waitFor(() => expect(screen.getByText('Aplicar Filtros')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Aplicar Filtros'))
  })
})

describe('NuevaSolicitudForm', () => {
  it('valida carrito vacío; permite agregar y enviar', async () => {
    const { container } = render(<NuevaSolicitudForm />)
    fireEvent.click(screen.getByRole('button', { name: /Nueva Solicitud/ }))
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    await waitFor(() => expect(screen.getByText(/al menos un producto/)).toBeInTheDocument())
    const sel = container.querySelector('select') as HTMLSelectElement
    fireEvent.change(sel, { target: { value: 'p1' } })
    fireEvent.click(screen.getByText('Agregar'))
    fireEvent.change(container.querySelector('#title')!, { target: { value: 'T' } })
    fireEvent.change(container.querySelector('#description')!, { target: { value: 'D' } })
    fireEvent.submit(form)
    await waitFor(() => expect(actions.createRequestAction).toHaveBeenCalled())
  })
})
