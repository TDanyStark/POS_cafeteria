import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/types/catalog'
import type { Sale } from '@/types/sales'
import type { DailySummary, StockAlert } from '@/types/reports'

function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export function useDailySummary() {
  const today = getTodayDateString()

  return useQuery<DailySummary>({
    queryKey: ['dashboard', 'daily-summary', today],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DailySummary>>(`/reports/sales-summary?date_from=${today}&date_to=${today}`)
      return data.data!
    },
  })
}

export function useLatestSales(limit: number = 5) {
  const today = getTodayDateString()

  return useQuery<Sale[]>({
    queryKey: ['dashboard', 'latest-sales', limit, today],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Sale>>(`/sales?date_from=${today}&date_to=${today}&limit=${limit}`)
      return data.data
    },
  })
}

export function useStockAlerts() {
  return useQuery<StockAlert[]>({
    queryKey: ['dashboard', 'stock-alerts'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<StockAlert>>('/reports/stock-alerts?page=1&per_page=20')
      return data.data
    },
  })
}
