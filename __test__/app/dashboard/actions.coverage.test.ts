import {
  getBandejaAprobaciones,
  getMisNotificaciones,
  marcarNotificacionesLeidas,
  createRequestAction,
  actualizarEstadoSolicitud,
  anularSolicitudPropia,
} from '@/app/dashboard/actions'
import { createClient } from '@/lib/supabase/server'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))

describe('actions: bandeja, notificaciones y ramas adicionales', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = { auth: { getUser: jest.fn() }, from: jest.fn() }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('getBandeja: sin sesión retorna arreglo vacío', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    expect(await getBandejaAprobaciones()).toEqual([])
  })

  it('getBandeja: sin perfil retorna arreglo vacío', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } } })
    let n = 0
    mockSupabase.from.mockImplementation((t: string) => {
      if (t === 'profiles' && n++ === 0) {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }
      }
      return {}
    })
    expect(await getBandejaAprobaciones()).toEqual([])
  })

  function emptyThenable() {
    const t: any = {
      eq: () => t,
      in: () => t,
      lte: () => t,
      gt: () => t,
      then: (fn: (v: { data: unknown[]; error: null }) => unknown) => fn({ data: [], error: null }),
    }
    return t
  }
  const stubRequestsBase = {
    select: () => ({ order: () => emptyThenable() }),
  }

  it('getBandeja: comprador no tiene bandeja', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } } })
    mockSupabase.from.mockImplementation((t: string) => {
      if (t === 'profiles') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'comprador' }, error: null }) }) }) }
      }
      if (t === 'requests') return stubRequestsBase
      return {}
    })
    expect(await getBandejaAprobaciones()).toEqual([])
  })

  it('getBandeja: jefe sin subordinados retorna []', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'j' } } })
    let profileFrom = 0
    mockSupabase.from.mockImplementation((t: string) => {
      if (t === 'profiles') {
        profileFrom++
        if (profileFrom === 1) {
          return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'jefe', id: 'j' }, error: null }) }) }) }
        }
        if (profileFrom === 2) {
          return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }
        }
      }
      if (t === 'requests') return stubRequestsBase
      return {}
    })
    expect(await getBandejaAprobaciones()).toEqual([])
  })

  it('getBandeja: jefe con subordinados devuelve solicitudes o [] si error de query', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'j' } } })
    const rows = [{ id: 'r1' }]
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      then: (fn: (v: { data: typeof rows; error: { message: string } | null }) => unknown) =>
        Promise.resolve({ data: rows, error: null }).then(fn),
    }
    let p = 0
    mockSupabase.from.mockImplementation((t: string) => {
      if (t === 'profiles' && p++ === 0) {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'jefe' }, error: null }) }) }) }
      }
      if (t === 'profiles' && p === 1) {
        return { select: () => ({ eq: () => Promise.resolve({ data: [{ id: 's1' }], error: null }) }) }
      }
      if (t === 'requests') return queryBuilder
      return queryBuilder
    })
    const out = await getBandejaAprobaciones()
    expect(out).toEqual(rows)

    // Error en query
    const qbErr = { ...queryBuilder, then: (fn: any) => Promise.resolve({ data: null, error: { message: 'q' } }).then(fn) }
    p = 0
    mockSupabase.from.mockImplementation((t: string) => {
      if (t === 'profiles' && p++ === 0) {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'jefe' }, error: null }) }) }) }
      }
      if (t === 'profiles' && p === 1) {
        return { select: () => ({ eq: () => Promise.resolve({ data: [{ id: 's1' }], error: null }) }) }
      }
      return qbErr
    })
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(await getBandejaAprobaciones()).toEqual([])
    } finally {
      errSpy.mockRestore()
    }
  })

  it.each([
    ['financiero_1' as const, { lte: true }],
    ['financiero_2' as const, { range: true }],
    ['financiero_3' as const, { high: true }],
  ])('getBandeja: %s aplica filtro de monto', async (role) => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'f' } } })
    const steps: string[] = []
    const queryBuilder: any = {
      select: () => (steps.push('select'), queryBuilder),
      order: () => (steps.push('order'), queryBuilder),
      eq: (c: string, v: unknown) => (steps.push(`eq:${c}:${v}`), queryBuilder),
      lte: (c: string, v: number) => (steps.push(`lte:${c}:${v}`), queryBuilder),
      gt: (c: string, v: number) => (steps.push(`gt:${c}:${v}`), queryBuilder),
      then: (fn: any) => Promise.resolve({ data: [], error: null }).then(fn),
    }
    mockSupabase.from.mockImplementation((t: string) => {
      if (t === 'profiles') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role }, error: null }) }) }) }
      }
      if (t === 'requests') return queryBuilder
      return queryBuilder
    })
    await getBandejaAprobaciones()
    expect(steps.join('|')).toContain('pendiente_financiero')
  })

  it('getMisNotificaciones: sin usuario', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    expect(await getMisNotificaciones()).toEqual([])
  })

  it('getMisNotificaciones: con error de BD', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } } })
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => Promise.resolve({ data: null, error: { message: 'e' } }),
    }
    mockSupabase.from.mockReturnValue(chain)
    try {
      expect(await getMisNotificaciones()).toEqual([])
    } finally {
      errSpy.mockRestore()
    }
  })

  it('getMisNotificaciones: retorna filas', async () => {
    const filas = [{ id: 'n1' }]
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } } })
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => Promise.resolve({ data: filas, error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    expect(await getMisNotificaciones()).toEqual(filas)
  })

  it('marcarNotificacionesLeidas: no hace update si no hay user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const u = { update: jest.fn() }
    mockSupabase.from.mockReturnValue(u)
    await marcarNotificacionesLeidas()
    expect(u.update).not.toHaveBeenCalled()
  })

  it('marcarNotificacionesLeidas: actualiza notificaciones', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } } })
    const chain = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() }
    mockSupabase.from.mockReturnValue(chain)
    await marcarNotificacionesLeidas()
    expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    expect(chain.update).toHaveBeenCalledWith({ is_read: true })
  })

  it('createRequestAction: lanza si no hay usuario', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const fd = new FormData()
    await expect(createRequestAction(fd, [])).rejects.toThrow('Usuario no autenticado')
  })

  it('createRequestAction: retorna error de insert en requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } } })
    const chain = { insert: () => chain, select: () => chain, single: () => Promise.resolve({ data: null, error: { message: 'DB' } }) }
    mockSupabase.from.mockReturnValue(chain)
    const fd = new FormData()
    fd.set('title', 't')
    fd.set('description', 'd')
    const r = await createRequestAction(fd, [{ id: 'p1', price: 1, quantity: 1, subtotal: 1 }])
    expect(r).toEqual({ error: 'DB' })
  })

  it('createRequestAction: retorna error al insertar ítems', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } } })
    let fromCalls = 0
    mockSupabase.from.mockImplementation((t: string) => {
      if (t === 'requests') {
        fromCalls++
        return {
          insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'R1' }, error: null }) }) }),
        }
      }
      if (t === 'request_items') {
        return { insert: () => Promise.resolve({ data: null, error: { message: 'ie' } }) }
      }
      return {}
    })
    const fd = new FormData()
    fd.set('title', 't')
    fd.set('description', 'd')
    const r = await createRequestAction(fd, [{ id: 'p1', price: 1, quantity: 1, subtotal: 1 }])
    expect(r?.error).toMatch(/Error al insertar los productos/)
  })

  it('actualizarEstado: sin autenticación y sin perfil', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    expect(await actualizarEstadoSolicitud('a', 'aprobar')).toEqual({ error: 'No autenticado' })
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } } })
    mockSupabase.from.mockReturnValue({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) })
    expect(await actualizarEstadoSolicitud('a', 'aprobar')).toEqual({ error: 'Perfil no encontrado' })
  })

  it('actualizarEstado: sin permisos de aprobador al aprobar', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } } })
    mockSupabase.from.mockReturnValue({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'comprador' }, error: null }) }) }) })
    const r = await actualizarEstadoSolicitud('a', 'aprobar')
    expect(r).toEqual({ error: 'No tienes permisos de aprobador' })
  })

  it('actualizarEstado: error en update', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } } })
    const chain = {
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'jefe' }, error: null }) }) }),
    }
    mockSupabase.from.mockImplementation((t: string) => {
      if (t === 'profiles') return chain
      if (t === 'requests') {
        return {
          update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'u' } }) }) }) }),
        }
      }
      return {}
    })
    const r = await actualizarEstadoSolicitud('a', 'aprobar')
    expect(r).toEqual({ error: 'u' })
  })

  it('anular: solicitud no encontrada o sin permiso de dueño de fila', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSupabase.from.mockReturnValue({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'e' } }) }) }) })
    expect(await anularSolicitudPropia('r', 'u1')).toEqual({ error: 'Solicitud no encontrada' })
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { user_id: 'otro', status: 'pendiente_jefe' }, error: null }),
        }),
      }),
    })
    expect(await anularSolicitudPropia('r', 'u1')).toEqual({ error: 'No tienes permisos sobre esta solicitud' })
  })

  it('anular: falla update o audit log con console', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    // update vacío
    let reqN = 0
    mockSupabase.from.mockImplementation((t: string) => {
      if (t === 'requests' && reqN++ === 0) {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { user_id: 'u1', status: 'pendiente_jefe' }, error: null }) }) }) }
      }
      if (t === 'requests' && reqN > 0) {
        return { update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) }) }
      }
      return {}
    })
    const r1 = await anularSolicitudPropia('r', 'u1')
    expect(r1.error).toBeDefined()

    // audit error: lectura, update con fila, insert audit falla
    let reqC = 0
    mockSupabase.from.mockImplementation((t: string) => {
      if (t === 'requests') {
        reqC++
        if (reqC === 1) {
          return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { user_id: 'u1', status: 'pendiente_jefe' }, error: null }) }) }) }
        }
        if (reqC === 2) {
          return { update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: [{ id: 'r' }], error: null }) }) }) }
        }
      }
      if (t === 'audit_logs') {
        return { insert: () => Promise.resolve({ error: { message: 'a' } }) }
      }
      return {}
    })
    try {
      await anularSolicitudPropia('r', 'u1')
    } finally {
      errSpy.mockRestore()
    }
  })
})
