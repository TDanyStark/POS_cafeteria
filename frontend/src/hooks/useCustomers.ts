import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/types/catalog'
import type { Customer } from '@/types/sales'

export interface CustomerFilters {
  page?: number
  limit?: number
  search?: string
}

export function useCustomers(filters: CustomerFilters = {}) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.search) params.set('search', filters.search)

  return useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Customer>>(`/customers?${params.toString()}`)
      return data
    },
  })
}

export function useCustomerSearch(query: string) {
  return useQuery<Customer[]>({
    queryKey: ['customers', 'search', query],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Customer>>(`/customers?q=${encodeURIComponent(query)}`)
      return data.data
    },
    enabled: query.trim().length >= 2,
    staleTime: 10_000,
  })
}

export function useCustomer(id: number) {
  return useQuery<Customer>({
    queryKey: ['customers', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Customer>>(`/customers/${id}`)
      return data.data!
    },
    enabled: id > 0,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation<Customer, Error, { name: string; phone: string; email?: string | null }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<Customer>>('/customers', payload)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation<Customer, Error, { id: number; name: string; phone: string; email?: string | null }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiResponse<Customer>>(`/customers/${id}`, payload)
      return data.data!
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] })
    },
  })
}
