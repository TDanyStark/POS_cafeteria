import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse } from '@/types/catalog'
import type { SalesSummary, StockAlert, TopSeller } from '@/types/reports'

export function useTopSellers(limit: number = 10, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)

  return useQuery<TopSeller[]>({
    queryKey: ['reports', 'top-sellers', limit, dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TopSeller[]>>(`/reports/top-sellers?${params.toString()}`)
      return data.data!
    },
  })
}

export function useSalesSummary(dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)

  return useQuery<SalesSummary>({
    queryKey: ['reports', 'sales-summary', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SalesSummary>>(`/reports/sales-summary?${params.toString()}`)
      return data.data!
    },
  })
}

export function useStockAlerts() {
  return useQuery<StockAlert[]>({
    queryKey: ['reports', 'stock-alerts'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StockAlert[]>>('/reports/stock-alerts')
      return data.data!
    },
  })
}
