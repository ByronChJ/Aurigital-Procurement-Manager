import { createRequestAction, actualizarEstadoSolicitud } from '../actions'
import { createClient } from '@/lib/supabase/server'

// 1. Mockeamos revalidatePath de Next.js
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// 2. Mockeamos el cliente de Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('Server Actions de Lógica de Negocio (Compras y Aprobaciones)', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reseteamos mocks antes de cada prueba
    jest.clearAllMocks()

    // 3. Setup de cadena de Mocks profundos para emular el SDK de Supabase
    const chainableMock = {
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
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
    it('devuelve error si los datos son inválidos o el carrito está vacío', async () => {
      // Configuramos usuario autenticado válido
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

      const formData = new FormData()
      formData.append('title', '') // Título vacío
      formData.append('description', 'Test')

      const cartItems: any[] = [] // Carrito vacío

      const result = await createRequestAction(formData, cartItems)

      expect(result).toEqual({ error: 'Datos de solicitud inválidos o carrito vacío' })
      expect(mockSupabase.from).not.toHaveBeenCalled() // Nunca intentó tocar la BD
    })

    it('procesa maestro-detalle e inserta trazabilidad correctamente', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      
      // Simulamos la respuesta del insert a "requests"
      mockSupabase.from().single.mockResolvedValueOnce({ 
        data: { id: 'request-1' }, error: null 
      }) // Para requests
      // Simulamos la consulta al profile para notificar jefe
      mockSupabase.from().single.mockResolvedValueOnce({ 
        data: { boss_id: 'jefe-1' }, error: null 
      }) // Para profiles (notificación)

      const formData = new FormData()
      formData.append('title', 'Compra de Laptops')
      formData.append('description', 'Renovación anual')

      const cartItems = [
        { id: 'prod-1', price: 1000, quantity: 2, subtotal: 2000 }
      ]

      const result = await createRequestAction(formData, cartItems)

      expect(result).toEqual({ success: true })
      
      // Verifica que insertó en la tabla de solicitudes principales
      expect(mockSupabase.from).toHaveBeenCalledWith('requests')
      
      // Verifica que intentó hacer el bulk insert en los items
      expect(mockSupabase.from).toHaveBeenCalledWith('request_items')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ product_id: 'prod-1', quantity: 2 })
        ])
      )

      // Verifica auditoría criptográfica
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ action: 'creacion' })
        ])
      )
    })
  })

  describe('actualizarEstadoSolicitud', () => {
    it('debería cambiar de estado y registrar auditoría si un jefe aprueba', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'jefe-1' } } })
      
      // Mock para validar que es jefe
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { role: 'jefe' }, error: null
      })

      // Mock para el Update
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { user_id: 'user-1', title: 'Solicitud Test', amount: 500 }, error: null
      })

      const result = await actualizarEstadoSolicitud('request-1', 'aprobar')

      expect(result).not.toHaveProperty('error')

      // Verificar que mandó actualizar el status
      expect(mockSupabase.from).toHaveBeenCalledWith('requests')
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pendiente_financiero' })
      )

      // Verificar que audita
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ action: 'aprobacion', changed_by_user: 'jefe-1' })
        ])
      )
    })

    it('debería registrar el rechazo y el motivo', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'jefe-1' } } })
      
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { role: 'jefe' }, error: null
      })

      mockSupabase.from().single.mockResolvedValueOnce({
        data: { user_id: 'user-1', title: 'Mala compra', amount: 500 }, error: null
      })

      await actualizarEstadoSolicitud('request-2', 'rechazar', 'Presupuesto denegado')

      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({ 
          status: 'rechazado',
          rejection_reason: 'Presupuesto denegado' 
        })
      )
    })
  })
})
