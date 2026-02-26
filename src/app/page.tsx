import { redirect } from 'next/navigation'

export default function Home() {
    // Redirigir la raíz directamente al login
    redirect('/login')
}
