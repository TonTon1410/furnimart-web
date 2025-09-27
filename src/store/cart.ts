/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/cart.ts
import { create } from "zustand"
import { cartService, type CartDTO } from "@/service/cartService"

export type CartItem = {
  id: string;        // productId:colorId
  productId: string;
  colorId: string;
  colorName?: string;
  title: string;
  price: number;
  qty: number;
  image?: string;
  cartItemId?: number;
}

type CartState = {
  items: CartItem[];
  count: number;
  total: number;
  loading: boolean;
  error?: string;

  fetch: () => Promise<void>;
  add: (productId: string, qty?: number, colorId?: string) => Promise<void>;
  updateQty: (productId: string, colorId: string, qty: number) => Promise<void>;
  remove: (productId: string, colorId: string) => Promise<void>;   // <- nhận thêm colorId
  clear: () => Promise<void>;

  addLocal: (item: Omit<CartItem, "qty" | "id">, qty?: number) => void;
}

const mapFromDTO = (data: CartDTO) => {
  const items: CartItem[] = data.items.map((i) => ({
    id: `${i.productId}:${i.colorId}`,
    productId: i.productId,
    colorId: i.colorId,
    colorName: i.colorName,
    title: i.productName,
    image: i.image,
    price: i.price,
    qty: i.quantity,
    cartItemId: i.cartItemId,
  }))
  const total = data.totalPrice
  const count = items.reduce((s, it) => s + it.qty, 0)
  return { items, total, count }
}

const recompute = (items: CartItem[]) => ({
  items,
  count: items.reduce((s, i) => s + i.qty, 0),
  total: items.reduce((s, i) => s + i.price * i.qty, 0),
})

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

  add: async (productId, qty = 1, colorId) => {
    if (!colorId) throw new Error("colorId là bắt buộc khi thêm vào giỏ hàng")
    set({ error: undefined })
    await cartService.add(productId, qty, colorId)
    await get().fetch()
  },

  updateQty: async (productId, colorId, qty) => {
    set({ error: undefined })
    const minQty = Math.max(1, qty)
    const key = `${productId}:${colorId}`
    const prevItems = get().items
    const nextItems = prevItems.map((it) =>
      it.id === key ? { ...it, qty: minQty } : it
    )
    set(recompute(nextItems))
    try {
      await cartService.update(productId, minQty, colorId)
    } catch (e: any) {
      set({ ...recompute(prevItems), error: e?.response?.data?.message || "Cập nhật số lượng thất bại" })
    }
  },

  // ✅ Xoá đúng 1 biến thể (optimistic)
  remove: async (productId, colorId) => {
    set({ error: undefined })
    const key = `${productId}:${colorId}`
    const prevItems = get().items
    const nextItems = prevItems.filter(it => it.id !== key)
    set(recompute(nextItems))
    try {
      await cartService.removeOne(productId, colorId)
    } catch (e: any) {
      // rollback nếu lỗi
      set({ ...recompute(prevItems), error: e?.response?.data?.message || "Xoá sản phẩm thất bại" })
    }
  },

  clear: async () => {
    // Nếu backend có /api/carts/clear thì dùng thẳng; nếu không, dùng removeMany theo productId (xoá hết biến thể)
    const ids = [...new Set(get().items.map((i) => i.productId))]
    if (ids.length === 0) return
    set({ error: undefined })
    await cartService.removeMany(ids)
    await get().fetch()
  },

  addLocal: (item, qty = 1) => {
    const items = [...get().items]
    const key = `${item.productId}:${item.colorId}`
    const idx = items.findIndex((i) => i.id === key)
    if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + qty }
    else items.push({ ...item, id: key, qty })
    set(recompute(items))
  },
}))

export const selectCartItems  = (s: CartState) => s.items
export const selectCartTotal  = (s: CartState) => s.total
export const selectCartCount  = (s: CartState) => s.count

export default useCartStore
