// Gráfico de reportes: estados con/sin datos (Recharts bajo JSDOM)
import { render, screen } from '@testing-library/react'
import ReporteGrafico from '@/app/dashboard/reportes/ReporteGrafico'

// Simulamos ResizeObserver para Recharts en JSDOM
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver

jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts')
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <OriginalRecharts.ResponsiveContainer width={800} height={800}>
        {children}
      </OriginalRecharts.ResponsiveContainer>
    ),
  }
})

describe('ReporteGrafico', () => {
  beforeEach(() => {
    // Recharts emite un aviso inofensivo sobre tamaños fijos con ResponsiveContainer
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('muestra aviso cuando no hay puntos para graficar (vacío o indefinido)', () => {
    // Cubre la rama de datos insuficientes para evitar gráficos vacíos
    const { rerender } = render(<ReporteGrafico data={[]} />)
    expect(screen.getByText('No hay datos suficientes para graficar.')).toBeInTheDocument()

    rerender(<ReporteGrafico data={undefined as unknown as { name: string }[]} />)
    expect(screen.getByText('No hay datos suficientes para graficar.')).toBeInTheDocument()
  })

  it('monta la gráfica Recharts cuando existen filas de datos', () => {
    // Con datos válidos debe renderizar el contenedor de Recharts, no el mensaje vacío
    const mockData = [{ name: 'Estado de Solicitudes', Aprobadas: 10, Rechazadas: 2, Pendientes: 5 }]
    const { container } = render(<ReporteGrafico data={mockData} />)
    expect(screen.queryByText('No hay datos suficientes para graficar.')).not.toBeInTheDocument()
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument()
  })
})
