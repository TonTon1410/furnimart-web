/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/cart.ts
import { create } from "zustand";
import { cartService, type CartDTO } from "@/service/cartService";

export type CartItem = {
  id: string; // productColorId hoặc productId:colorId
  productId: string;
  productColorId: string; // ID của biến thể sản phẩm (productColor)
  colorId: string;
  colorName?: string;
  title: string;
  price: number;
  qty: number;
  image?: string;
  cartItemId?: number;
};

type CartState = {
  items: CartItem[];
  count: number;
  total: number;
  loading: boolean;
  error?: string;

  fetch: () => Promise<void>;
  add: (productColorId: string, qty?: number) => Promise<void>;
  updateQty: (productColorId: string, qty: number) => Promise<void>;
  remove: (productColorId: string) => Promise<void>;
  clear: () => Promise<void>;

  addLocal: (item: Omit<CartItem, "qty" | "id">, qty?: number) => void;
};

const mapFromDTO = (data: CartDTO) => {
  const items: CartItem[] = data.items.map((i) => ({
    id: i.productColorId, // Sử dụng productColorId làm key duy nhất
    productId: i.productId,
    productColorId: i.productColorId,
    colorId: i.colorId,
    colorName: i.colorName,
    title: i.productName,
    image: i.image,
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

  add: async (productColorId: string, qty = 1) => {
    set({ error: undefined });
    await cartService.add(productColorId, qty);
    await get().fetch();
  },

  updateQty: async (productColorId: string, qty: number) => {
    set({ error: undefined });
    const minQty = Math.max(1, qty);
    const prevItems = get().items;
    const nextItems = prevItems.map((it) =>
      it.productColorId === productColorId ? { ...it, qty: minQty } : it
    );
    set(recompute(nextItems));
    try {
      await cartService.update(productColorId, minQty);
    } catch (e: any) {
      set({
        ...recompute(prevItems),
        error: e?.response?.data?.message || "Cập nhật số lượng thất bại",
      });
    }
  },

  // Xoá 1 biến thể sản phẩm (optimistic)
  remove: async (productColorId: string) => {
    set({ error: undefined });
    const prevItems = get().items;
    const nextItems = prevItems.filter(
      (it) => it.productColorId !== productColorId
    );
    set(recompute(nextItems));
    try {
      await cartService.removeOne(productColorId);
    } catch (e: any) {
      // rollback nếu lỗi
      set({
        ...recompute(prevItems),
        error: e?.response?.data?.message || "Xoá sản phẩm thất bại",
      });
    }
  },

  clear: async () => {
    // Nếu backend có /api/carts/clear thì dùng thẳng; nếu không, dùng removeMany theo productId (xoá hết biến thể)
    const ids = [...new Set(get().items.map((i) => i.productId))];
    if (ids.length === 0) return;
    set({ error: undefined });
    await cartService.removeMany(ids);
    await get().fetch();
  },

  addLocal: (item, qty = 1) => {
    const items = [...get().items];
    const idx = items.findIndex(
      (i) => i.productColorId === item.productColorId
    );
    if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + qty };
    else items.push({ ...item, id: item.productColorId, qty });
    set(recompute(items));
  },
}));

export const selectCartItems = (s: CartState) => s.items;
export const selectCartTotal = (s: CartState) => s.total;
export const selectCartCount = (s: CartState) => s.count;

export default useCartStore;
