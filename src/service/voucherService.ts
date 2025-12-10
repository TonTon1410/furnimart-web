import axiosClient from "./axiosClient";

// Định nghĩa kiểu dữ liệu cơ bản cho Voucher
export interface Voucher {
  id: number;
  name: string;
  code: string;
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  amount: number;
  description: string;
  point: number;
  type: "PERCENTAGE" | "FIXED_AMOUNT"; // Giả định
  status: boolean;
  orderId: number;
  usageLimit: number;
  usedCount: number;
  minimumOrderAmount: number;
  createdAt: string;
  updatedAt: string;
  expired: boolean;
  active: boolean;
  // Thêm các trường khác nếu cần
}

// Định nghĩa kiểu dữ liệu cho Payload (khi tạo/cập nhật)
export interface VoucherPayload {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  amount: number;
  description: string;
  point: number;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | string; // Cho phép string để linh hoạt hơn
  status: boolean;
  orderId: number;
  usageLimit: number;
  minimumOrderAmount: number;
  // Trường này có thể có trong payload của Swagger nhưng thường không cần khi tạo/cập nhật
  endDataAfterStartDate?: boolean;
}

const vouchersService = {
  // ✅ Lấy danh sách tất cả voucher
  getVoucherList: async () => {
    const url = `/vouchers`;
    return axiosClient.get<Voucher[]>(url);
  },

  // ✅ Lấy thông tin voucher theo ID
  getVoucherByID: async (voucherId: string | number) => {
    const url = `/vouchers/${voucherId}`;
    return axiosClient.get<Voucher>(url);
  },

  // ✅ Lấy thông tin voucher theo Code
  getVoucherByCode: async (code: string) => {
    const url = `/vouchers/code/${code}`;
    return axiosClient.get<Voucher>(url);
  },

  // ✅ Tạo mới voucher
  createVoucher: async (data: VoucherPayload) => {
    const url = `/vouchers`;
    return axiosClient.post<Voucher>(url, data);
  },

  // ✅ Cập nhật thông tin voucher theo ID
  updateVoucher: async (voucherId: string | number, data: VoucherPayload) => {
    const url = `/vouchers/${voucherId}`;
    return axiosClient.put<Voucher>(url, data);
  },

  // ✅ Xóa voucher
  deleteVoucher: async (voucherId: string | number) => {
    const url = `/vouchers/${voucherId}`;
    return axiosClient.delete(url); // Response body có thể là {}
  },

  // ⚠️ API /api/vouchers/apply chưa có trong list yêu cầu, nhưng là chức năng quan trọng
  // POST /api/vouchers/apply?code={code}&orderId={orderId}
  applyVoucherToOrder: async (code: string, orderId: string | number) => {
    const url = `/vouchers/apply?code=${encodeURIComponent(
      code
    )}&orderId=${orderId}`;
    return axiosClient.post<Voucher>(url);
  },
};

export default vouchersService;