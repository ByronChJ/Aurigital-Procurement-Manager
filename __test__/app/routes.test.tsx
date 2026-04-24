// Humo mínimo: home → login, layout y login page (no montamos el dashboard completo: coste de memoria en Jest)
import { render } from '@testing-library/react'
import Home from '@/app/page'
import RootLayout from '@/app/layout'
import LoginPage from '@/app/login/page'

const redirect = jest.fn()
jest.mock('next/navigation', () => ({ redirect: (...a: unknown[]) => redirect(...a) }))

jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter' }),
}))

describe('Rutas básicas', () => {
  it('página raíz redirige a /login', () => {
    Home()
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('root layout renderiza children', () => {
    const { getByText } = render(
      <RootLayout>
        <div>hijo</div>
      </RootLayout>
    )
    expect(getByText('hijo')).toBeInTheDocument()
  })

  it('login muestra formulario y mensaje en query', async () => {
    const ui = await LoginPage({ searchParams: Promise.resolve({ message: 'E' }) })
    const { getByText } = render(ui)
    expect(getByText('Aurigital')).toBeInTheDocument()
    expect(getByText('E')).toBeInTheDocument()
  })
})
