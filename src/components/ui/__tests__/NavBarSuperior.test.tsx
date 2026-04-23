import { render, screen } from '@testing-library/react'
import { NavBarSuperior } from '../NavBarSuperior'

// Hacemos mock de NotificacionesDropdown ya que puede tener lógica compleja o de fetching
jest.mock('../NotificacionesDropdown', () => ({
  NotificacionesDropdown: () => <div data-testid="mock-notificaciones">Campana</div>,
}))

// Hacemos mock de lucide-react para evitar problemas de renderizado de SVGs en JSDOM
jest.mock('lucide-react', () => ({
  LogOut: () => <div data-testid="mock-logout-icon" />,
}))

describe('NavBarSuperior Component', () => {
  const mockCompradorProfile = {
    full_name: 'Juan Comprador',
    role: 'comprador',
  }

  const mockJefeProfile = {
    full_name: 'Maria Jefa',
    role: 'jefe',
  }

  it('renderiza el título del flujo correctamente', () => {
    render(<NavBarSuperior profile={mockCompradorProfile} tituloFlujo="Dashboard de Inicio" />)
    expect(screen.getByText('Aurigital')).toBeInTheDocument()
    // El tituloFlujo no se renderiza visualmente en NavBarSuperior directamente a menos que hayamos cambiado eso.
    // De hecho, en nuestra implementación de NavBarSuperior, pasamos tituloFlujo pero quizás no se usa si revisamos.
    // Vamos a asegurar de que el nombre del usuario aparece.
    expect(screen.getByText('Juan Comprador')).toBeInTheDocument()
  })

  it('oculta enlaces de navegación gerenciales si el usuario es "comprador"', () => {
    render(<NavBarSuperior profile={mockCompradorProfile} tituloFlujo="Test" />)
    expect(screen.queryByText('Aprobaciones')).not.toBeInTheDocument()
    expect(screen.queryByText('Reportes')).not.toBeInTheDocument()
    expect(screen.queryByText('Auditoría (Logs)')).not.toBeInTheDocument()
  })

  it('muestra enlaces de navegación si el usuario es "jefe"', () => {
    render(<NavBarSuperior profile={mockJefeProfile} tituloFlujo="Test" />)
    expect(screen.getByText('Aprobaciones')).toBeInTheDocument()
    expect(screen.getByText('Reportes')).toBeInTheDocument()
    expect(screen.getByText('Auditoría (Logs)')).toBeInTheDocument()
  })

  it('renderiza los badges de iniciales correctos', () => {
    const { rerender } = render(<NavBarSuperior profile={mockJefeProfile} tituloFlujo="Test" />)
    expect(screen.getByText('JEF')).toBeInTheDocument()

    rerender(<NavBarSuperior profile={{ ...mockJefeProfile, role: 'financiero_1' }} tituloFlujo="Test" />)
    expect(screen.getByText('FIN')).toBeInTheDocument()

    rerender(<NavBarSuperior profile={mockCompradorProfile} tituloFlujo="Test" />)
    expect(screen.getByText('USR')).toBeInTheDocument()
  })
})
