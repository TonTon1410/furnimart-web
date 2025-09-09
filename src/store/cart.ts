import { create } from "zustand";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  qty: number;
  image?: string;
};

export type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  total: number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  add: (item, qty = 1) => {
    const items = [...get().items];
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + qty };
    else items.push({ ...item, qty });
    set({ items });
  },
  remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  clear: () => set({ items: [] }),
  get count() { return get().items.reduce((s, i) => s + i.qty, 0); },
  get total() { return get().items.reduce((s, i) => s + i.price * i.qty, 0); },
}));

// ✅ Optional: selector helpers để dùng gọn trong component
export const selectCartCount = (s: CartState) => s.count;
export const selectCartTotal = (s: CartState) => s.total;
export const selectCartItems = (s: CartState) => s.items;
