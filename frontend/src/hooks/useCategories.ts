import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse, Category, PaginatedResponse } from '@/types/catalog'

export interface CategoryFilters {
  page?: number
  per_page?: number
  search?: string
}

export function useCategories(filters: CategoryFilters = {}) {
  const params = new URLSearchParams()
  params.set('page', String(filters.page ?? 1))
  params.set('per_page', String(filters.per_page ?? 100))
  if (filters.search) params.set('search', filters.search)

  return useQuery<PaginatedResponse<Category>>({
    queryKey: ['categories', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Category>>(`/categories?${params.toString()}`)
      return data
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, Error, { name: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<Category>>('/categories', payload)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, Error, { id: number; name: string }>({
    mutationFn: async ({ id, name }) => {
      const { data } = await api.put<ApiResponse<Category>>(`/categories/${id}`, { name })
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete<ApiResponse<null>>(`/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
