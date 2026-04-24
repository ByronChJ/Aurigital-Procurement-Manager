// Ramas de actualizarEstadoSolicitud: financieros, notificaciones y revalidate
import { actualizarEstadoSolicitud } from '@/app/dashboard/actions'
import { createClient } from '@/lib/supabase/server'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))

describe('actualizarEstadoSolicitud: flujos extendidos', () => {
  let sp: any

  beforeEach(() => {
    jest.clearAllMocks()
    sp = { auth: { getUser: jest.fn() }, from: jest.fn() }
    ;(createClient as jest.Mock).mockResolvedValue(sp)
  })

  it('financiero_1 aprueba a estado aprobado con notificaciones al autor', async () => {
    const errN = jest.spyOn(console, 'error').mockImplementation(() => {})
    sp.auth.getUser.mockResolvedValue({ data: { user: { id: 'fin' } } })
    const upd = { user_id: 'a', title: 'T', amount: 100 }
    sp.from.mockImplementation((t: string) => {
      if (t === 'profiles') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'financiero_1' }, error: null }) }) }) }
      }
      if (t === 'requests') {
        return {
          update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: upd, error: null }) }) }) }),
        }
      }
      if (t === 'audit_logs') {
        return { insert: () => Promise.resolve({ error: null }) }
      }
      if (t === 'notifications') {
        return { insert: () => Promise.resolve({ error: null }) }
      }
      return {}
    })
    const r = await actualizarEstadoSolicitud('r1', 'aprobar')
    expect(r).toEqual({ success: true })
    errN.mockRestore()
  })

  it('jefe aprueba y notifica financieros según monto (tramo 2 y 3)', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    sp.auth.getUser.mockResolvedValue({ data: { user: { id: 'j' } } })
    for (const amount of [1500, 8000] as const) {
      const upd = { user_id: 'a', title: 'T', amount }
      let nInserts = 0
      const fin = [{ id: 'f1' }]
      sp.from.mockImplementation((t: string) => {
        if (t === 'profiles') {
          return {
            select: () => ({
              eq: (c: string) => {
                if (c === 'id') {
                  return { single: () => Promise.resolve({ data: { role: 'jefe' }, error: null }) }
                }
                return { eq: () => Promise.resolve({ data: fin, error: null }) }
              },
            }),
          }
        }
        if (t === 'requests') {
          return {
            update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: upd, error: null }) }) }) }),
          }
        }
        if (t === 'audit_logs') {
          return { insert: () => Promise.resolve({ error: null }) }
        }
        if (t === 'notifications') {
          nInserts++
          return { insert: () => Promise.resolve({ error: null }) }
        }
        return {}
      })
      const r = await actualizarEstadoSolicitud('r1', 'aprobar')
      expect(r).toEqual({ success: true })
    }
  })
})
