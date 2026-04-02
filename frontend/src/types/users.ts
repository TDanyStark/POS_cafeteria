export interface UserListItem {
  id: number
  name: string
  email: string
  role: 'admin' | 'cashier'
  active: boolean
  created_at: string
  updated_at: string
}

export interface UserFilters {
  page?: number
  per_page?: number
  search?: string
  active?: boolean | null
}

export interface UserUpsertPayload {
  name: string
  email: string
  password?: string
  active: boolean
}
