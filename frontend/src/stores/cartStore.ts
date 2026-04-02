import { create } from 'zustand'
import type { CartItem, Customer, PaymentMethod } from '@/types/sales'

interface CartState {
  items: CartItem[]
  customer: Customer | null
  paymentMethod: PaymentMethod
  amountPaid: number
  notes: string

  // Actions
  addItem: (item: Omit<CartItem, 'quantity' | 'subtotal'>) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  setCustomer: (customer: Customer | null) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setAmountPaid: (amount: number) => void
  setNotes: (notes: string) => void
  clearCart: () => void

  // Computed helpers (used as methods)
  getTotal: () => number
  getChange: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  paymentMethod: 'cash',
  amountPaid: 0,
  notes: '',

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.product_id === product.product_id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product_id === product.product_id
              ? {
                  ...i,
                  quantity: Math.min(i.quantity + 1, product.stock),
                  subtotal: (i.quantity + 1) * i.unit_price,
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
            quantity: 1,
            subtotal: product.unit_price,
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
      items: state.items.map((i) =>
        i.product_id === productId
          ? { ...i, quantity: Math.min(quantity, i.stock), subtotal: Math.min(quantity, i.stock) * i.unit_price }
          : i
      ),
    }))
  },

  setCustomer: (customer) => set({ customer }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setAmountPaid: (amountPaid) => set({ amountPaid }),
  setNotes: (notes) => set({ notes }),

  clearCart: () =>
    set({
      items: [],
      customer: null,
      paymentMethod: 'cash',
      amountPaid: 0,
      notes: '',
    }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
  getChange: () => {
    const state = get()
    if (state.paymentMethod !== 'cash') return 0
    return Math.max(0, state.amountPaid - state.getTotal())
  },
}))
