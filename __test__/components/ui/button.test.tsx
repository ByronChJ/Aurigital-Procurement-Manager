// Comprueba variantes y accesibilidad básica del botón reutilizable
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renderiza el texto hijo dentro del elemento button', () => {
    // Verifica el caso básico de un botón accesible con etiqueta visible
    render(<Button>Guardar</Button>)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('aplica variante outline cuando se pide explícitamente', () => {
    // La variante outline debe incluir borde (clases de contorno)
    const { container } = render(<Button variant="outline">Cancelar</Button>)
    const el = container.querySelector('button')
    expect(el?.className).toMatch(/border/)
  })

  it('reenvía atributos nativos como disabled al DOM', () => {
    // Asegura que el ref y props de HTML button siguen funcionando
    render(
      <Button disabled data-testid="btn-des">
        No disponible
      </Button>
    )
    expect(screen.getByTestId('btn-des')).toBeDisabled()
  })
})
