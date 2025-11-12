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

// Debounce timers cho updateQty - lưu theo productColorId
const updateTimers = new Map<string, NodeJS.Timeout>();

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
    console.log("🛒 [Cart] Fetching cart data...");
    set({ loading: true, error: undefined });
    try {
      const data = await cartService.getMyCart();
      const mapped = mapFromDTO(data);
      set({ items: mapped.items, total: mapped.total, count: mapped.count });
      console.log(
        "✅ [Cart] Fetched successfully:",
        mapped.items.length,
        "items"
      );
    } catch (e: any) {
      console.error("❌ [Cart] Fetch failed:", e);
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
    const minQty = Math.max(1, qty);

    console.log(`🔄 [Cart] Update quantity for ${productColorId}:`, minQty);

    // Cập nhật UI ngay lập tức (optimistic update)
    const prevItems = get().items;
    const nextItems = prevItems.map((it) =>
      it.productColorId === productColorId ? { ...it, qty: minQty } : it
    );
    set(recompute(nextItems));

    // Clear timer cũ nếu có
    if (updateTimers.has(productColorId)) {
      clearTimeout(updateTimers.get(productColorId)!);
      console.log(`⏱️  [Cart] Cleared previous timer for ${productColorId}`);
    }

    // Debounce API call - chỉ gọi sau 500ms không có thay đổi
    const timer = setTimeout(async () => {
      console.log(
        `📡 [Cart] Sending update request for ${productColorId}:`,
        minQty
      );
      set({ error: undefined });
      try {
        await cartService.update(productColorId, minQty);
        console.log(`✅ [Cart] Update successful for ${productColorId}`);
        // Không cần fetch lại vì đã update optimistically
      } catch (e: any) {
        console.error(`❌ [Cart] Update failed for ${productColorId}:`, e);
        // Rollback nếu lỗi
        set({
          ...recompute(prevItems),
          error: e?.response?.data?.message || "Cập nhật số lượng thất bại",
        });
      } finally {
        updateTimers.delete(productColorId);
      }
    }, 500); // Đợi 500ms sau lần thay đổi cuối cùng

    updateTimers.set(productColorId, timer);
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
