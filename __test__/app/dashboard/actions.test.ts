// Pruebas unitarias de acciones de servidor en dashboard (Solicitudes, catálogo, anulación)
import {
  createRequestAction,
  actualizarEstadoSolicitud,
  getProductosCatalogo,
  getDetalleSolicitud,
  anularSolicitudPropia,
} from '@/app/dashboard/actions'
import { createClient } from '@/lib/supabase/server'

// Mockeamos revalidatePath de Next.js
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Mockeamos el cliente de Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('Acciones de servidor: compras, catálogo y aprobaciones', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    const chainableMock = {
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnValue(chainableMock),
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('createRequestAction', () => {
    it('regresa error si los datos no son válidos o el carrito está vacío', async () => {
      // Aseguramos un usuario autenticado; la regla de negocio falla por carrito o campos
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

      const formData = new FormData()
      formData.append('title', '')
      formData.append('description', 'Test')

      const cartItems: any[] = []

      const result = await createRequestAction(formData, cartItems)

      expect(result).toEqual({ error: 'Datos de solicitud inválidos o carrito vacío' })
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('inserta cabecera, detalle, auditoría y notificación cuando el flujo es correcto', async () => {
      // Flujo exitoso: maestro, ítems, trazas y aviso al jefe según el perfil
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockSupabase.from().single.mockResolvedValueOnce({ data: { id: 'request-1' }, error: null })
      mockSupabase.from().single.mockResolvedValueOnce({ data: { boss_id: 'jefe-1' }, error: null })

      const formData = new FormData()
      formData.append('title', 'Compra de Laptops')
      formData.append('description', 'Renovación anual')

      const cartItems = [{ id: 'prod-1', price: 1000, quantity: 2, subtotal: 2000 }]

      const result = await createRequestAction(formData, cartItems)

      expect(result).toEqual({ success: true })
      expect(mockSupabase.from).toHaveBeenCalledWith('requests')
      expect(mockSupabase.from).toHaveBeenCalledWith('request_items')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ product_id: 'prod-1', quantity: 2 })])
      )
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ action: 'creacion' })])
      )
    })
  })

  describe('actualizarEstadoSolicitud', () => {
    it('como jefe, aprueba y deja la solicitud pendiente de finanzas con auditoría', async () => {
      // El jefe pasa el trámite a finanzas y deja rastro de aprobación
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'jefe-1' } } })
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { role: 'jefe' },
        error: null,
      })
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { user_id: 'user-1', title: 'Solicitud Test', amount: 500 },
        error: null,
      })

      const result = await actualizarEstadoSolicitud('request-1', 'aprobar')

      expect(result).not.toHaveProperty('error')
      expect(mockSupabase.from).toHaveBeenCalledWith('requests')
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pendiente_financiero' })
      )
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ action: 'aprobacion', changed_by_user: 'jefe-1' }),
        ])
      )
    })

    it('rechaza y persiste el motivo en el registro de la solicitud', async () => {
      // Rechazo con motivo visible para trazabilidad
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'jefe-1' } } })
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { role: 'jefe' },
        error: null,
      })
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { user_id: 'user-1', title: 'Mala compra', amount: 500 },
        error: null,
      })

      await actualizarEstadoSolicitud('request-2', 'rechazar', 'Presupuesto denegado')

      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rechazado',
          rejection_reason: 'Presupuesto denegado',
        })
      )
    })
  })

  describe('getProductosCatalogo', () => {
    it('retorna el listado cuando Supabase responde sin error', async () => {
      // Catálogo de productos activos ordenado por nombre
      const filas = [{ id: 'p1', name: 'Item', is_active: true }]
      mockSupabase.from().order.mockResolvedValue({ data: filas, error: null })

      const result = await getProductosCatalogo()

      expect(result).toEqual(filas)
      expect(mockSupabase.from).toHaveBeenCalledWith('products')
    })

    it('retorna arreglo vacío si la consulta devuelve error', async () => {
      // No exponemos errores crudos: lista vacía como fallback; silenciamos console.error del código
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockSupabase.from().order.mockResolvedValue({ data: null, error: { message: 'fallo' } })
      try {
        const result = await getProductosCatalogo()
        expect(result).toEqual([])
      } finally {
        errSpy.mockRestore()
      }
    })
  })

  describe('getDetalleSolicitud', () => {
    it('retorna filas con join a productos cuando la consulta es exitosa', async () => {
      // Detalle con datos enriquecidos de producto
      const detalle = [{ id: 'ri1', request_id: 'r1' }]
      mockSupabase.from().eq.mockResolvedValue({ data: detalle, error: null })

      const result = await getDetalleSolicitud('r1')

      expect(result).toEqual(detalle)
      expect(mockSupabase.from).toHaveBeenCalledWith('request_items')
    })

    it('retorna arreglo vacío ante error de Supabase', async () => {
      // Misma política: sin datos si la lectura falla; el handler usa console.error
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockSupabase.from().eq.mockResolvedValue({ data: null, error: { message: 'db' } })
      try {
        const result = await getDetalleSolicitud('r1')
        expect(result).toEqual([])
      } finally {
        errSpy.mockRestore()
      }
    })
  })

  describe('anularSolicitudPropia', () => {
    it('completa anulación y escribe auditoría cuando el dueño anula en estado válido', async () => {
      // Primer from: leer estado; segundo from: update; tercer from: log de anulación
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      let requestsFrom = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'requests') {
          requestsFrom++
          if (requestsFrom === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { user_id: 'u1', status: 'pendiente_jefe' },
                error: null,
              }),
            }
          }
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: [{ id: 'req1' }], error: null }),
          }
        }
        if (table === 'audit_logs') {
          return { insert: jest.fn().mockResolvedValue({ data: null, error: null }) }
        }
        return {}
      })

      const result = await anularSolicitudPropia('req1', 'u1')

      expect(result).toEqual({ success: true })
    })

    it('rechaza si el id de sesión no coincide con el id pasado a la acción', async () => {
      // Evita que se anule en nombre de otro usuario
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

      const result = await anularSolicitudPropia('req1', 'otro')

      expect(result).toEqual({ error: 'No autorizado' })
    })

    it('rechaza cuando la solicitud ya no está en pendiente de jefe', async () => {
      // Solo se permite anular antes de avanzar en el flujo
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'requests') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'u1', status: 'aprobado' },
              error: null,
            }),
          }
        }
        return {}
      })

      const result = await anularSolicitudPropia('req1', 'u1')

      expect(result).toEqual({ error: 'Solo se pueden anular solicitudes en "Pendiente Jefe"' })
    })
  })
})
