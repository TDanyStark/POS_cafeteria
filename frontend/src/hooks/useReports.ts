import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/types/catalog'
import type { SalesSummary, StockAlert, TopSeller } from '@/types/reports'

export function useTopSellers(page: number = 1, perPage: number = 10, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('per_page', String(perPage))
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)

  return useQuery<PaginatedResponse<TopSeller>>({
    queryKey: ['reports', 'top-sellers', page, perPage, dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<TopSeller>>(`/reports/top-sellers?${params.toString()}`)
      return data
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

export function useStockAlerts(page: number = 1, perPage: number = 20) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('per_page', String(perPage))

  return useQuery<PaginatedResponse<StockAlert>>({
    queryKey: ['reports', 'stock-alerts', page, perPage],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<StockAlert>>(`/reports/stock-alerts?${params.toString()}`)
      return data
    },
  })
}
