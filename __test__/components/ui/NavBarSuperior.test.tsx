// Navegación condicionada por rol e identidad en la barra superior
import { render, screen } from '@testing-library/react'
import { NavBarSuperior } from '@/components/ui/NavBarSuperior'

jest.mock('@/components/ui/NotificacionesDropdown', () => ({
  NotificacionesDropdown: () => <div data-testid="mock-notificaciones">Campana</div>,
}))

jest.mock('lucide-react', () => ({
  LogOut: () => <div data-testid="mock-logout-icon" />,
}))

describe('NavBarSuperior', () => {
  const perfilComprador = {
    full_name: 'Juan Comprador',
    role: 'comprador',
  }

  const perfilJefe = {
    full_name: 'Maria Jefa',
    role: 'jefe',
  }

  it('muestra marca y nombre del usuario con rol', () => {
    // Comprueba cabecera principal y descripción del perfil activo
    render(<NavBarSuperior profile={perfilComprador} tituloFlujo="Dashboard de Inicio" />)
    expect(screen.getByText('Aurigital')).toBeInTheDocument()
    expect(screen.getByText('Juan Comprador')).toBeInTheDocument()
  })

  it('oculta enlaces de aprobación, reportes y auditoría para rol comprador', () => {
    // Los compradores no deben ver rutas de aprobación ni reporting
    render(<NavBarSuperior profile={perfilComprador} tituloFlujo="Test" />)
    expect(screen.queryByText('Aprobaciones')).not.toBeInTheDocument()
    expect(screen.queryByText('Reportes')).not.toBeInTheDocument()
    expect(screen.queryByText('Auditoría (Logs)')).not.toBeInTheDocument()
  })

  it('muestra enlaces de gestión para rol jefe', () => {
    // Jefes deben acceder a aprobaciones, reportes y auditoría
    render(<NavBarSuperior profile={perfilJefe} tituloFlujo="Test" />)
    expect(screen.getByText('Aprobaciones')).toBeInTheDocument()
    expect(screen.getByText('Reportes')).toBeInTheDocument()
    expect(screen.getByText('Auditoría (Logs)')).toBeInTheDocument()
  })

  it('muestra iniciales distintas según rol (jefe, financiero, resto)', () => {
    // Valida mapeo de rol a badge de tres letras
    const { rerender } = render(<NavBarSuperior profile={perfilJefe} tituloFlujo="Test" />)
    expect(screen.getByText('JEF')).toBeInTheDocument()

    rerender(<NavBarSuperior profile={{ ...perfilJefe, role: 'financiero_1' }} tituloFlujo="Test" />)
    expect(screen.getByText('FIN')).toBeInTheDocument()

    rerender(<NavBarSuperior profile={perfilComprador} tituloFlujo="Test" />)
    expect(screen.getByText('USR')).toBeInTheDocument()
  })
})
