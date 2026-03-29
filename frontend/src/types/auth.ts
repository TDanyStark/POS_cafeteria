export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'cashier'
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    token: string
    user: User
  }
  message?: string
  errors?: Record<string, string | null>
}

export interface MeResponse {
  success: boolean
  data?: User
  message?: string
}
