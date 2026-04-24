// getLogsAuditoria con rango de fechas, acción e ilike de usuario
import { getLogsAuditoria } from '@/app/dashboard/reportes/accionesReportes'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))

function buildBuilder(result: { data: unknown; error: unknown }) {
  const b: any = { calls: [] as string[] }
  b.select = () => b
  b.order = () => b
  b.gte = (a: string, v: string) => (b.calls.push(`gte:${a}`), b)
  b.lte = (a: string, v: string) => (b.calls.push(`lte:${a}`), b)
  b.eq = (a: string, v: string) => (b.calls.push(`eq:${a}`), b)
  b.ilike = (a: string, v: string) => (b.calls.push('ilike'), b)
  b.then = (fn: (r: typeof result) => unknown) => Promise.resolve(result).then(fn)
  return b
}

describe('getLogsAuditoria filtros', () => {
  let sp: { from: jest.Mock }

  beforeEach(() => {
    jest.clearAllMocks()
    sp = { from: jest.fn() }
    ;(createClient as jest.Mock).mockResolvedValue({ from: sp.from })
  })

  it('aplica gte, lte, eq e ilike según parámetros', async () => {
    const builder = buildBuilder({ data: [{ id: 1 }], error: null })
    sp.from.mockReturnValue(builder)
    await getLogsAuditoria('2024-01-01', '2024-12-31', 'creacion', 'Juan')
    expect(builder.calls.some((c) => c.startsWith('gte:'))).toBe(true)
    expect(builder.calls.some((c) => c.startsWith('lte:'))).toBe(true)
    expect(builder.calls.some((c) => c === 'eq:action')).toBe(true)
    expect(builder.calls).toContain('ilike')
  })

  it('no aplica eq de acción si es todas', async () => {
    const builder = buildBuilder({ data: [], error: null })
    sp.from.mockReturnValue(builder)
    await getLogsAuditoria(undefined, undefined, 'todas', undefined)
    expect(builder.calls.filter((c) => c === 'eq:action').length).toBe(0)
  })
})
