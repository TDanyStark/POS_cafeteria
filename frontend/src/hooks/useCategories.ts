import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse, Category } from '@/types/catalog'

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Category[] }>('/categories')
      return data.data
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
      await api.delete(`/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
