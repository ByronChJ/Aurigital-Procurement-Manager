jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({ tag: 'server' })),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    getAll: () => [],
    set: jest.fn(() => {
      throw new Error('no set')
    }),
  }),
}))

describe('createClient (server)', () => {
  it('crea el cliente e invoca setAll con catch silencioso', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const c = await createClient()
    expect(c).toEqual({ tag: 'server' })
    const { createServerClient } = require('@supabase/ssr')
    const opts = (createServerClient as jest.Mock).mock.calls[0][2]
    expect(() => opts.cookies.setAll([{ name: 'a', value: 'b', options: {} as any }])).not.toThrow()
  })
})
