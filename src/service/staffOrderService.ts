/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosClient from "./axiosClient";

// ───────────────────────────────────────────────
// REQUEST TYPES
// ───────────────────────────────────────────────

export interface OrderDetailRequest {
  productColorId: string;
  quantity: number;
  price: number;
}

export interface CreateStaffOrderRequest {
  storeId: string;
  customerName: string;
  phone: string;
  addressLine: string;
  orderDetails: OrderDetailRequest[];
  paymentMethod: "COD" | "VN_PAY" | string;
  note?: string;
  reason?: string;
}

// ───────────────────────────────────────────────
// RESPONSE TYPES
// ───────────────────────────────────────────────

interface Image3D {
  image3d: string;
  status: string;
  modelUrl: string;
  format: string;
  sizeInMb: number;
  previewImage: string;
}

interface Image {
  image: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  code: string;
  thumbnailImage: string;
  slug: string;
  weight: number;
  height: number;
  status: string;
  width: number;
  length: number;
  categoryName: string;
  color: any[];
  materialName: string;
  images: Image[];
  images3d: Image3D[];
}

interface Color {
  id: string;
  colorName: string;
  hexCode: string;
  images: Image[];
  models3D: Image3D[];
}

interface ProductColor {
  id: string;
  product: Product;
  color: Color;
  images: Image[];
  models3D: Image3D[];
  status: string;
}

interface OrderDetailResponse {
  id: number;
  productColorId: string;
  quantity: number;
  price: number;
  productColor: ProductColor;
}

interface OrderUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: boolean;
  birthday: string;
  avatar: string;
  cccd: string;
  point: number;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderAddress {
  id: number;
  name: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  street: string;
  addressLine: string;
  isDefault: boolean;
  userId: string;
  userName: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

interface OrderPayment {
  id: number;
  transactionCode: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  date: string;
}

interface ProcessOrder {
  id: number;
  status: string;
  createdAt: string;
}

export interface StaffOrderData {
  id: number;
  user: OrderUser;
  storeId: string;
  address: OrderAddress;
  total: number;
  note: string;
  orderDate: string;
  status: string;
  reason: string;
  orderDetails: OrderDetailResponse[];
  processOrders: ProcessOrder[];
  payment: OrderPayment;
  qrCode: string;
  depositPrice: number;
  qrCodeGeneratedAt: string;
  pdfFilePath: string;
  hasPdfFile: boolean;
}

export interface CreateStaffOrderResponse {
  status: number;
  message: string;
  data: StaffOrderData;
  timestamp: string;
  redirectUrl: string;
}

// ───────────────────────────────────────────────
// SERVICE IMPLEMENTATION
// ───────────────────────────────────────────────

const staffOrderService = {
  /**
   * Tạo đơn hàng dành cho nhân viên (Staff only)
   * Sử dụng axiosClient để tận dụng cấu hình base URL và interceptors (token).
   * Endpoint: /orders/staff/create
   */
  createOrder: async (payload: CreateStaffOrderRequest) => {
    // Dùng relative path để axiosClient tự động nối vào baseURL
    const url = "/orders/staff/create";
    return axiosClient.post<CreateStaffOrderResponse>(url, payload);
  },
};

export default staffOrderService;