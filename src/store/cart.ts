/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/cart.ts
import { create } from "zustand"
import { cartService, type CartDTO } from "@/service/cartService"

/* ===== Types ===== */
export type CartItem = {
  id: string;        // ✅ khóa hiển thị: productId:colorId (để phân biệt biến thể)
  productId: string;
  colorId: string;
  title: string;
  price: number;
  qty: number;
  image?: string;
  cartItemId?: number; // nếu cần debug/hiển thị
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
  remove: (productId: string) => Promise<void>;  // ⚠️ xóa theo productId (API limit)
  clear: () => Promise<void>;

  addLocal: (item: Omit<CartItem, "qty" | "id">, qty?: number) => void;
}

/* ===== Helpers ===== */
const mapFromDTO = (data: CartDTO): { items: CartItem[]; total: number; count: number } => {
  const items: CartItem[] = data.items.map((i) => ({
    id: `${i.productId}:${i.colorId}`, // ✅ phân biệt theo biến thể
    productId: i.productId,
    colorId: i.colorId,
    title: i.productName,
    image: i.image,         // ảnh theo màu đã được backend trả
    price: i.price,
    qty: i.quantity,
    cartItemId: i.cartItemId,
  }));
  const total = data.totalPrice;
  const count = items.reduce((s, it) => s + it.qty, 0);
  return { items, total, count };
};

const recompute = (items: CartItem[]) => ({
  items,
  count: items.reduce((s, i) => s + i.qty, 0),
  total: items.reduce((s, i) => s + i.price * i.qty, 0),
});

/* ===== Store ===== */
export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  count: 0,
  total: 0,
  loading: false,
  error: undefined,

  fetch: async () => {
    set({ loading: true, error: undefined });
    try {
      const data = await cartService.getMyCart();
      const mapped = mapFromDTO(data);
      set({ items: mapped.items, total: mapped.total, count: mapped.count });
    } catch (e: any) {
      set({ error: e?.response?.data?.message || "Không thể tải giỏ hàng" });
    } finally {
      set({ loading: false });
    }
  },

  // ✅ thêm colorId theo spec
  add: async (productId, qty = 1, colorId) => {
    if (!colorId) throw new Error("colorId là bắt buộc khi thêm vào giỏ hàng");
    await cartService.add(productId, qty, colorId);
    await get().fetch();
  },

  // ✅ update kèm colorId theo spec
  updateQty: async (productId, colorId, qty) => {
    await cartService.update(productId, qty, colorId);
    await get().fetch();
  },

  // ⚠️ API remove theo productId → có thể xóa hết biến thể của sản phẩm
  remove: async (productId) => {
    await cartService.removeOne(productId);
    await get().fetch();
  },

  clear: async () => {
    const ids = [...new Set(get().items.map((i) => i.productId))];
    if (ids.length === 0) return;
    await cartService.removeMany(ids);
    await get().fetch();
  },

  // Local mode (guest) — nếu cần giữ biến thể, cũng nên phân biệt theo colorId
  addLocal: (item, qty = 1) => {
    const items = [...get().items];
    const key = `${item.productId}:${item.colorId}`;
    const idx = items.findIndex((i) => i.id === key);
    if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + qty };
    else items.push({ ...item, id: key, qty });
    set(recompute(items));
  },
}));

export const selectCartItems  = (s: CartState) => s.items;
export const selectCartTotal  = (s: CartState) => s.total;
export const selectCartCount  = (s: CartState) => s.count;

export default useCartStore;
