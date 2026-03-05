import { login } from './actions'

import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/forms'

export default async function LoginPage(
    props: {
        searchParams: Promise<{ message?: string }>
    }
) {
    const searchParams = await props.searchParams;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg border border-gray-100 dark:border-gray-700">

                {/* Cabecera del Login */}
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Aurigital
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sistema de Gestión de Compras
                    </p>
                </div>

                {/* Formulario que llama a la función login (Server Action) */}
                <form className="mt-8 space-y-6" action={login}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <Label htmlFor="email">
                                Correo Electrónico
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1"
                                placeholder="usuario@aurigital.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">
                                Contraseña
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* Mostrar mensaje de error si existe en los parámetros de búsqueda */}
                    {searchParams?.message && (
                        <p className="mt-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-md text-center">
                            {searchParams.message}
                        </p>
                    )}

                    <div>
                        <Button
                            type="submit"
                            className="w-full"
                        >
                            {/* Botón de envío de credenciales a Supabase */}
                            Iniciar Sesión
                        </Button>
                    </div>
                </form>

            </div>
        </div>
    )
}
