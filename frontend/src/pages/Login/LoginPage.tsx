import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Coffee, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/axios'
import type { LoginCredentials, AuthResponse } from '@/types/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>()

  const onSubmit = async (data: LoginCredentials) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data)

      if (response.data.success && response.data.data) {
        login(response.data.data.token, response.data.data.user)
        toast.success('Bienvenido')
        navigate('/dashboard')
      } else {
        toast.error(response.data.message || 'Error al iniciar sesión')
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: AuthResponse } }
      if (err.response?.data) {
        const errorData = err.response.data
        toast.error(errorData.message || 'Error al iniciar sesión')

        if (errorData.errors) {
          Object.entries(errorData.errors).forEach(([field, message]) => {
            if (message) {
              setError(field as keyof LoginCredentials, { message })
            }
          })
        }
      } else {
        toast.error('Error de conexión')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Coffee className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Cafetería POS</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@cafeteria.com"
                {...register('email', { required: 'El correo es requerido' })}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'La contraseña es requerida' })}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
