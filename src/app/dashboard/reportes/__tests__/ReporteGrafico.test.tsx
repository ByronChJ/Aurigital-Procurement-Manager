import { render, screen } from '@testing-library/react'
import ReporteGrafico from '../ReporteGrafico'

// Mockeamos el ResizeObserver que Recharts necesita internamente
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver

// Mockeamos ResponsiveContainer para que JSDOM renderice los hijos sin requerir ancho/alto en px
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts')
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => (
      <OriginalRecharts.ResponsiveContainer width={800} height={800}>
        {children}
      </OriginalRecharts.ResponsiveContainer>
    ),
  }
})


describe('ReporteGrafico Component', () => {
  it('muestra el mensaje de datos insuficientes si data es nulo o vacío', () => {
    const { rerender } = render(<ReporteGrafico data={[]} />)
    expect(screen.getByText('No hay datos suficientes para graficar.')).toBeInTheDocument()

    rerender(<ReporteGrafico data={undefined as any} />)
    expect(screen.getByText('No hay datos suficientes para graficar.')).toBeInTheDocument()
  })

  it('renderiza la gráfica si hay datos proporcionados', () => {
    const mockData = [
      { name: 'Estado de Solicitudes', Aprobadas: 10, Rechazadas: 2, Pendientes: 5 }
    ]

    const { container } = render(<ReporteGrafico data={mockData} />)
    // Cuando hay datos, no se muestra el mensaje de vacío
    expect(screen.queryByText('No hay datos suficientes para graficar.')).not.toBeInTheDocument()
    
    // Debería existir el contenedor con clase "recharts-wrapper"
    const rechartsWrapper = container.querySelector('.recharts-wrapper')
    expect(rechartsWrapper).toBeInTheDocument()
  })
})
