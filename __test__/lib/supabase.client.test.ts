import { createClient } from '@/lib/supabase/client'

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({})),
}))

describe('createClient (browser)', () => {
  it('llama a createBrowserClient con url y clave pública', () => {
    const OLD = { ...process.env }
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'u'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'k'
    const { createBrowserClient } = require('@supabase/ssr')
    createClient()
    expect(createBrowserClient).toHaveBeenCalledWith('u', 'k')
    process.env = OLD
  })
})
