// Pruebas de signIn, logout y redirecciones
import { login, logout } from '@/app/login/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>

describe('login (acción de autenticación)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirige al login con mensaje traducido si las credenciales no son válidas', async () => {
    // Mapea "Invalid login credentials" a texto en español en la query string
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          error: { message: 'Invalid login credentials' },
        }),
      },
    })
    const formData = new FormData()
    formData.set('email', 'a@b.com')
    formData.set('password', 'mala')
    await login(formData)
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('Autenticación fallida. Revisa tu correo y contraseña.'))
    )
  })

  it('redirige al dashboard tras un inicio de sesión correcto', async () => {
    // Camino feliz: redirect a /dashboard
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
      },
    })
    const formData = new FormData()
    formData.set('email', 'ok@b.com')
    formData.set('password', 'secreto')
    await login(formData)
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('logout cierra sesión y redirige al login', async () => {
    const signOut = jest.fn().mockResolvedValue(undefined)
    ;(createClient as jest.Mock).mockResolvedValue({ auth: { signOut } })
    await logout()
    expect(signOut).toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})
