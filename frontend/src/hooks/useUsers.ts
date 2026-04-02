import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/types/catalog'
import type { UserFilters, UserListItem, UserUpsertPayload } from '@/types/users'

export function useUsers(filters: UserFilters = {}) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  if (filters.search) params.set('search', filters.search)
  if (filters.active != null) params.set('active', filters.active ? '1' : '0')

  return useQuery<PaginatedResponse<UserListItem>>({
    queryKey: ['users', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<UserListItem>>(`/users?${params.toString()}`)
      return data
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<UserListItem, Error, UserUpsertPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<UserListItem>>('/users', payload)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation<UserListItem, Error, UserUpsertPayload & { id: number }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiResponse<UserListItem>>(`/users/${id}`, payload)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/users/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
