
import type { ProductSummary } from './dashboard.types';

// Hàm giả lập độ trễ mạng (500ms - 1000ms)
export const simulateNetworkRequest = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), Math.random() * 500 + 500);
  });
};

// Dữ liệu sản phẩm dùng chung
export const MOCK_PRODUCTS: ProductSummary[] = [
  { id: 'P01', name: 'Sofa Da Bò Ý Cao Cấp', thumbnail: 'https://placehold.co/100?text=Sofa', price: 15000000, sold: 120, stock: 5 },
  { id: 'P02', name: 'Bàn Ăn Gỗ Sồi 6 Ghế', thumbnail: 'https://placehold.co/100?text=Table', price: 8500000, sold: 95, stock: 2 },
  { id: 'P03', name: 'Giường Ngủ Pallet Gỗ Thông', thumbnail: 'https://placehold.co/100?text=Bed', price: 3200000, sold: 200, stock: 50 },
  { id: 'P04', name: 'Tủ Quần Áo 4 Cánh', thumbnail: 'https://placehold.co/100?text=Wardrobe', price: 6800000, sold: 60, stock: 1 },
  { id: 'P05', name: 'Đèn Chùm Pha Lê Phòng Khách', thumbnail: 'https://placehold.co/100?text=Lamp', price: 2500000, sold: 45, stock: 12 },
];