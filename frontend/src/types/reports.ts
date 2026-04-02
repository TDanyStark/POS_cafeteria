export interface TopSeller {
  id: number
  product_name: string
  category_id: number | null
  category_name: string | null
  total_quantity: number
  total_revenue: number
  rank: number
}

export interface SalesSummary {
  total_sales: number
  total_amount: number
  total_cash: number
  total_transfer: number
  by_method: Array<{
    payment_method: 'cash' | 'transfer'
    total_sales: number
    total_amount: number
  }>
}

export interface StockAlert {
  id: number
  product_name: string
  category_id: number | null
  category_name: string | null
  stock: number
  min_stock: number
  price: number
}

export interface DailySummary {
  total_sales: number
  total_amount: number
  total_cash: number
  total_transfer: number
  sales_count_today: number
  by_method: Array<{
    payment_method: 'cash' | 'transfer'
    total_sales: number
    total_amount: number
  }>
}
