import { create } from 'zustand'
import type { CartItem, Customer, PaymentMethod } from '@/types/sales'

interface CartState {
  items: CartItem[]
  customer: Customer | null
  paymentMethod: PaymentMethod
  amountPaid: number
  notes: string
  createDebt: boolean

  // Actions
  addItem: (item: Omit<CartItem, 'quantity' | 'subtotal'>) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  setCustomer: (customer: Customer | null) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setAmountPaid: (amount: number) => void
  setNotes: (notes: string) => void
  setCreateDebt: (create: boolean) => void
  clearCart: () => void

  // Computed helpers (used as methods)
  getTotal: () => number
  getChange: () => number
  getPendingDebt: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  paymentMethod: 'cash',
  amountPaid: 0,
  notes: '',
  createDebt: false,

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.product_id === product.product_id)
      const unitPrice = Number(product.unit_price)

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product_id === product.product_id
              ? {
                  ...i,
                  quantity: Math.min(i.quantity + 1, product.stock),
                  subtotal: (i.quantity + 1) * unitPrice,
                }
              : i
          ),
        }
      }
      return {
        items: [
          ...state.items,
          {
            ...product,
            unit_price: unitPrice,
            quantity: 1,
            subtotal: unitPrice,
          },
        ],
      }
    })
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.product_id !== productId),
    }))
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set((state) => ({
      items: state.items.map((i) => {
        if (i.product_id === productId) {
          const qty = Math.min(quantity, i.stock)
          return { 
            ...i, 
            quantity: qty, 
            subtotal: qty * Number(i.unit_price) 
          }
        }
        return i
      }),
    }))
  },

  setCustomer: (customer) => set({ customer }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setAmountPaid: (amountPaid) => set({ amountPaid }),
  setNotes: (notes) => set({ notes }),
  setCreateDebt: (createDebt) => set({ createDebt }),

  clearCart: () =>
    set({
      items: [],
      customer: null,
      paymentMethod: 'cash',
      amountPaid: 0,
      notes: '',
      createDebt: false,
    }),

  getTotal: () => get().items.reduce((sum, i) => sum + Number(i.subtotal), 0),
  getChange: () => {
    const state = get()
    if (state.paymentMethod !== 'cash' || state.createDebt) return 0
    return Math.max(0, state.amountPaid - state.getTotal())
  },
  getPendingDebt: () => {
    const state = get()
    if (!state.createDebt) return 0
    return Math.max(0, state.getTotal() - state.amountPaid)
  },
}))
