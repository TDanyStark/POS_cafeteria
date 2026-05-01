import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/types/catalog'
import type { CustomerDebt, DebtFilters, DebtPayment } from '@/types/sales'

export function useDebts(filters: DebtFilters = {}) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.status) params.set('status', filters.status)
  if (filters.customer_id) params.set('customer_id', String(filters.customer_id))
  if (filters.customer_name) params.set('customer_name', filters.customer_name)

  return useQuery<PaginatedResponse<CustomerDebt>>({
    queryKey: ['debts', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CustomerDebt>>(`/debts?${params.toString()}`)
      return data
    },
  })
}

export function useDebt(id: number) {
  return useQuery<{ debt: CustomerDebt; payments: DebtPayment[] }>({
    queryKey: ['debts', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ debt: CustomerDebt; payments: DebtPayment[] }>>(`/debts/${id}`)
      return data.data!
    },
    enabled: id > 0,
  })
}

interface AddDebtPaymentPayload {
  amount: number
  payment_method: 'cash' | 'transfer'
  notes?: string
}

export function useAddDebtPayment() {
  const queryClient = useQueryClient()

  return useMutation<CustomerDebt, Error, { debtId: number; payload: AddDebtPaymentPayload }>({
    mutationFn: async ({ debtId, payload }) => {
      const { data } = await api.post<ApiResponse<CustomerDebt>>(`/debts/${debtId}/payments`, payload)
      return data.data!
    },
    onSuccess: (_, { debtId }) => {
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['debts', debtId] })
      queryClient.invalidateQueries({ queryKey: ['cashRegister'] })
    },
  })
}