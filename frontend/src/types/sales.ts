export interface Customer {
  id: number
  name: string
  phone: string
  email: string | null
  created_at: string
  updated_at: string
}

export interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  product_name: string
  product_code?: string | null
  quantity: number
  unit_price: number
  subtotal: number
}

export type PaymentMethod = 'cash' | 'transfer'

export interface Sale {
  id: number
  cash_register_id: number
  user_id: number
  cashier_name: string
  customer_id: number | null
  customer_name: string | null
  customer_email?: string | null
  customer_phone: string | null
  total: number
  payment_method: PaymentMethod
  amount_paid: number
  change_amount: number
  notes: string | null
  items: SaleItem[]
  created_at: string
  updated_at: string
}

export interface CartItem {
  product_id: number
  product_name: string
  product_code?: string | null
  unit_price: number
  stock: number
  quantity: number
  subtotal: number
}

export interface CreateSalePayload {
  items: Array<{
    product_id: number
    quantity: number
  }>
  payment_method: PaymentMethod
  amount_paid: number
  customer_id?: number | null
  notes?: string
}

export interface SaleFilters {
  page?: number
  limit?: number
  date_from?: string
  date_to?: string
  payment_method?: PaymentMethod | ''
  user_id?: number | ''
}
