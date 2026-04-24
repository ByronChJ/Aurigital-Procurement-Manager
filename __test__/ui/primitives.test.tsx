// Pruebas de componentes UI base (card, formularios, tablas)
import { render, screen } from '@testing-library/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/forms'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

describe('Card', () => {
  it('compone encabezado, título y cuerpo', () => {
    render(
      <Card data-testid="c">
        <CardHeader>
          <CardTitle>T</CardTitle>
        </CardHeader>
        <CardContent>c</CardContent>
      </Card>
    )
    expect(screen.getByTestId('c')).toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByText('c')).toBeInTheDocument()
  })
})

describe('Input y Label', () => {
  it('asocia label con input por htmlFor / id', () => {
    render(
      <div>
        <Label htmlFor="x">E</Label>
        <Input id="x" name="e" defaultValue="v" />
      </div>
    )
    const input = screen.getByLabelText('E') as HTMLInputElement
    expect(input.value).toBe('v')
  })
})

describe('Table', () => {
  it('renderiza estructura de tabla accesible', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>A</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByRole('columnheader', { name: 'A' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '1' })).toBeInTheDocument()
  })
})
