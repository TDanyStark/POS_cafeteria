export interface CashMovement {
  id: number
  cash_register_id: number
  user_id: number
  user_name?: string
  type: 'in' | 'out'
  amount: number
  description: string
  created_at: string
  updated_at: string
}

export interface CashRegister {
  id: number
  user_id: number
  user_name?: string
  user_email?: string
  opened_at: string
  closed_at: string | null
  initial_amount: number
  final_amount: number | null
  declared_amount: number | null
  difference: number | null
  status: 'open' | 'closed'
  /** Computed by backend: initial_amount + cash_in - cash_out */
  expected_amount?: number
  cash_in?: number
  cash_out?: number
  movements?: CashMovement[]
  created_at: string
  updated_at: string
}

export interface OpenCashRegisterPayload {
  initial_amount: number
}

export interface CloseCashRegisterPayload {
  declared_amount: number
}

export interface AddMovementPayload {
  type: 'in' | 'out'
  amount: number
  description: string
}
