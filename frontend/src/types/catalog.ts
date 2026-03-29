export interface Category {
  id: number
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  code?: string | null
  category_id: number
  category_name?: string
  name: string
  price: number
  stock: number
  min_stock: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string | null>
}
