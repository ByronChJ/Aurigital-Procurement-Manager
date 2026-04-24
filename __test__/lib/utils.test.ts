// Comprueba el helper de clases reutilizado por los componentes UI
import { cn } from '@/lib/utils'

describe('cn (utilidad de clases CSS)', () => {
  it('fusiona clases condicionales y resuelve conflictos con tailwind-merge', () => {
    // Comprueba que clases contradictorias de Tailwind quedan la última ganadora
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('acepta valores booleanos falsy y los ignora', () => {
    // clsx omite false, null y undefined en la cadena final
    expect(cn('base', false && 'oculto', 'visible')).toBe('base visible')
  })

  it('combina múltiples strings en un solo className', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })
})
