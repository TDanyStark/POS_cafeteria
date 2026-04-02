import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse, PaginatedResponse, Product } from '@/types/catalog'

export interface ProductFilters {
  page?: number
  per_page?: number
  category_id?: number | null
  search?: string
  active?: boolean | null
}

export function useProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  if (filters.category_id != null) params.set('category_id', String(filters.category_id))
  if (filters.search) params.set('search', filters.search)
  if (filters.active != null) params.set('active', filters.active ? '1' : '0')

  return useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Product>>(`/products?${params.toString()}`)
      return data
    },
  })
}

export function useProduct(id: number) {
  return useQuery<Product>({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`)
      return data.data!
    },
    enabled: id > 0,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation<Product, Error, Partial<Product>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<Product>>('/products', payload)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation<Product, Error, Partial<Product> & { id: number }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, payload)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete<ApiResponse<null>>(`/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProductStock() {
  const queryClient = useQueryClient()

  return useMutation<Product, Error, { id: number; quantity: number }>({
    mutationFn: async ({ id, quantity }) => {
      const { data } = await api.patch<ApiResponse<Product>>(`/products/${id}/stock`, { quantity })
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
