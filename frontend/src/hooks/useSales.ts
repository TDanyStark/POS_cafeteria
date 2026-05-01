import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/types/catalog'
import type { CreateSalePayload, Sale, SaleFilters } from '@/types/sales'

export function useSales(filters: SaleFilters = {}) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.payment_method) params.set('payment_method', filters.payment_method)
  if (filters.user_id) params.set('user_id', String(filters.user_id))
  if (filters.cash_register_id) params.set('cash_register_id', String(filters.cash_register_id))

  return useQuery<PaginatedResponse<Sale>>({
    queryKey: ['sales', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Sale>>(`/sales?${params.toString()}`)
      return data
    },
  })
}

export function useSale(id: number) {
  return useQuery<Sale>({
    queryKey: ['sales', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Sale>>(`/sales/${id}`)
      return data.data!
    },
    enabled: id > 0,
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation<Sale, Error, CreateSalePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<Sale>>('/sales', payload)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['cashRegister'] })
    },
  })
}
