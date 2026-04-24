import { getMetricasDashboard, getLogsAuditoria } from '@/app/dashboard/reportes/accionesReportes'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Pruebas de agregación de reportes y consulta a audit_logs
describe('accionesReportes: métricas y auditoría', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = {
      auth: { getUser: jest.fn() },
      from: jest.fn(),
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('getMetricasDashboard', () => {
    it('retorna error cuando no hay usuario en sesión', async () => {
      // Sin sesión no se calculan métricas sensibles
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      const result = await getMetricasDashboard()

      expect(result).toEqual({ error: 'No autenticado' })
    })

    it('agrega contadores y gasto por departamento a partir de solicitudes', async () => {
      // Suma aprobadas/rechazadas/pendientes y desglose por depto
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            {
              status: 'aprobado',
              amount: 100,
              profiles: { department: 'Ventas' },
            },
            {
              status: 'rechazado',
              amount: 50,
              profiles: { department: 'IT' },
            },
            {
              status: 'pendiente_jefe',
              amount: 20,
              profiles: { department: 'IT' },
            },
          ],
          error: null,
        }),
      })

      const result = await getMetricasDashboard()

      expect(result).toMatchObject({
        aprobadas: 1,
        rechazadas: 1,
        pendientes: 1,
        montoTotalAprobado: 100,
        total: 3,
      })
      expect((result as any).gastoPorDepto).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Ventas', value: 100 })])
      )
    })

    it('propaga mensaje de error cuando falla la consulta a requests', async () => {
      // El caller puede mostrar el mensaje de red o de Supabase; se evita ruido en consola
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'timeout' },
        }),
      })
      try {
        const result = await getMetricasDashboard()
        expect(result).toEqual({ error: 'timeout' })
      } finally {
        errSpy.mockRestore()
      }
    })
  })

  describe('getLogsAuditoria', () => {
    function buildThenableQuery(final: { data: unknown; error: unknown }) {
      const q: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
      }
      q.then = (onFulfilled: (v: typeof final) => unknown) => Promise.resolve(final).then(onFulfilled)
      return q
    }

    it('retorna filas vacías si la consulta devuelve error', async () => {
      // Misma convención: lista vacía en lugar de lanzar; silenciamos console.error
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const query = buildThenableQuery({ data: null, error: { message: 'x' } })
      mockSupabase.from.mockReturnValue(query)
      try {
        const result = await getLogsAuditoria()
        expect(result).toEqual([])
      } finally {
        errSpy.mockRestore()
      }
    })

    it('retorna datos cuando la consulta de auditoría es correcta', async () => {
      // Consulta con orden y posibles filtros (ejecutables en cadena)
      const filas = [{ id: '1', action: 'creacion' }]
      const query = buildThenableQuery({ data: filas, error: null })
      mockSupabase.from.mockReturnValue(query)

      const result = await getLogsAuditoria()

      expect(result).toEqual(filas)
    })
  })
})
