// src/store/cart.ts
import { create } from "zustand"
import { cartService, type CartDTO } from "@/service/cartService"

/* ===== Types ===== */
export type CartItem = {
  id: string
  title: string
  price: number
  qty: number
  image?: string
}

type CartState = {
  items: CartItem[]
  count: number
  total: number
  loading: boolean
  error?: string

  // API actions
  fetch: () => Promise<void>
  add: (productId: string, qty?: number) => Promise<void>
  updateQty: (productId: string, qty: number) => Promise<void>
  remove: (productId: string) => Promise<void>
  clear: () => Promise<void>

  // Optional: local add cho guest
  addLocal: (item: Omit<CartItem, "qty">, qty?: number) => void
}

/* ===== Helpers ===== */
const mapFromDTO = (data: CartDTO): { items: CartItem[]; total: number; count: number } => {
  const items: CartItem[] = data.items.map((i) => ({
    id: i.productId,
    title: i.productName,
    image: i.thumbnail,
    price: i.price,
    qty: i.quantity,
  }))
  const total = data.totalPrice
  const count = items.reduce((s, i) => s + i.qty, 0)
  return { items, total, count }
}

const recompute = (items: CartItem[]) => ({
  items,
  count: items.reduce((s, i) => s + i.qty, 0),
  total: items.reduce((s, i) => s + i.price * i.qty, 0),
})

/* ===== Store ===== */
export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  count: 0,
  total: 0,
  loading: false,
  error: undefined,

  fetch: async () => {
    set({ loading: true, error: undefined })
    try {
      const data = await cartService.getMyCart()
      const mapped = mapFromDTO(data)
      set({ items: mapped.items, total: mapped.total, count: mapped.count })
    } catch (e: any) {
      set({ error: e?.response?.data?.message || "Không thể tải giỏ hàng" })
    } finally {
      set({ loading: false })
    }
  },

  add: async (productId, qty = 1) => {
    set({ error: undefined })
    await cartService.add(productId, qty)
    await get().fetch()
  },

  updateQty: async (productId, qty) => {
    set({ error: undefined })
    await cartService.update(productId, qty)
    await get().fetch()
  },

  remove: async (productId) => {
    set({ error: undefined })
    await cartService.removeOne(productId)
    await get().fetch()
  },

  clear: async () => {
    const ids = get().items.map((i) => i.id)
    if (ids.length === 0) return
    set({ error: undefined })
    await cartService.removeMany(ids)
    await get().fetch()
  },

  // Local mode (guest)
  addLocal: (item, qty = 1) => {
    const items = [...get().items]
    const idx = items.findIndex((i) => i.id === item.id)
    if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + qty }
    else items.push({ ...item, qty })
    set(recompute(items))
  },
}))

// Optional: selectors cho import gọn
export const selectCartItems = (s: CartState) => s.items
export const selectCartTotal = (s: CartState) => s.total
export const selectCartCount  = (s: CartState) => s.count

// Export default để ai đang import default vẫn dùng được
export default useCartStore
