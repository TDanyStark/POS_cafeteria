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
  create_debt?: boolean
}

export interface SaleFilters {
  page?: number
  limit?: number
  date_from?: string
  date_to?: string
  payment_method?: PaymentMethod | ''
  user_id?: number | ''
}

export interface CustomerDebt {
  id: number
  customer_id: number
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  sale_id: number
  original_amount: number
  paid_amount: number
  remaining_amount: number
  status: 'pending' | 'partial' | 'paid'
  sale_total: number
  payment_method: PaymentMethod
  amount_paid: number
  sale_created_at: string
  created_at: string
  updated_at: string
}

export interface DebtPayment {
  id: number
  debt_id: number
  user_id: number
  user_name: string
  cash_register_id: number | null
  amount: number
  payment_method: PaymentMethod
  notes: string | null
  created_at: string
}

export interface DebtFilters {
  page?: number
  limit?: number
  status?: 'pending' | 'partial' | 'paid' | ''
  customer_id?: number | ''
  customer_name?: string
}
