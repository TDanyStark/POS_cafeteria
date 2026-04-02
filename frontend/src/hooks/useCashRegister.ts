import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse } from '@/types/catalog'
import type {
  AddMovementPayload,
  CashRegister,
  CloseCashRegisterPayload,
  OpenCashRegisterPayload,
} from '@/types/cashRegister'

const QUERY_KEY = 'cashRegister'

export function useActiveCashRegister() {
  return useQuery<CashRegister | null>({
    queryKey: [QUERY_KEY, 'active'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CashRegister | null>>('/cash-registers/active')
      return data.data ?? null
    },
    staleTime: 30_000,
  })
}

export function useCashRegister(id: number) {
  return useQuery<CashRegister>({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CashRegister>>(`/cash-registers/${id}`)
      return data.data!
    },
    enabled: id > 0,
  })
}

export function useOpenCashRegister() {
  const queryClient = useQueryClient()

  return useMutation<CashRegister, Error, OpenCashRegisterPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<CashRegister>>('/cash-registers/open', payload)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useCloseCashRegister() {
  const queryClient = useQueryClient()

  return useMutation<CashRegister, Error, { id: number } & CloseCashRegisterPayload>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.post<ApiResponse<CashRegister>>(
        `/cash-registers/${id}/close`,
        payload
      )
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useAddMovement() {
  const queryClient = useQueryClient()

  return useMutation<CashRegister, Error, { id: number } & AddMovementPayload>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.post<ApiResponse<CashRegister>>(
        `/cash-registers/${id}/movements`,
        payload
      )
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useCashRegisterHistory(filters: { from?: string; to?: string; user_id?: number }) {
  return useQuery<CashRegister[]>({
    queryKey: [QUERY_KEY, 'history', filters],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CashRegister[]>>('/cash-registers', {
        params: filters,
      })
      return data.data!
    },
  })
}
