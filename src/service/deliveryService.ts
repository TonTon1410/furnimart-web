import axiosClient from "./axiosClient";

export interface DeliveryAssignment {
  id: number;
  orderId: number;
  storeId: string;
  deliveryStaffId: string;
  assignedBy: string;
  assignedAt: string;
  estimatedDeliveryDate: string;
  status:
    | "ASSIGNED"
    | "PREPARING"
    | "READY"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "CANCELLED";
  notes: string;
  invoiceGenerated: boolean;
  invoiceGeneratedAt: string;
  productsPrepared: boolean;
  productsPreparedAt: string;
  order: unknown;
  store: unknown;
}

export interface DeliveryConfirmation {
  id: number;
  orderId: number;
  deliveryStaffId: string;
  customerId: string;
  deliveryDate: string;
  deliveryPhotos: string[];
  deliveryNotes: string;
  qrCode: string;
  qrCodeGeneratedAt: string;
  qrCodeScannedAt: string | null;
  customerSignature: string | null;
  status: "DELIVERED" | "CONFIRMED" | "DISPUTED" | "CANCELLED";
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  deliveryAddress: string | null;
  isQrCodeScanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryConfirmationRequest {
  orderId: number;
  deliveryPhotos?: string[];
  deliveryNotes?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryAddress?: string;
}

export interface ScanQRRequest {
  qrCode: string;
  customerSignature?: string;
}

export interface PrepareProductsRequest {
  orderId: number;
  notes?: string;
}

const deliveryService = {
  // Lấy danh sách phân công giao hàng theo nhân viên
  getAssignmentsByStaff: async (
    deliveryStaffId: string
  ): Promise<DeliveryAssignment[]> => {
    const response = await axiosClient.get(
      `/delivery/assignments/staff/${deliveryStaffId}`
    );
    return response.data.data;
  },

  // Lấy danh sách phân công theo cửa hàng (cho STAFF/BRANCH_MANAGER)
  getAssignmentsByStore: async (
    storeId: string
  ): Promise<DeliveryAssignment[]> => {
    const response = await axiosClient.get(
      `/delivery/assignments/store/${storeId}`
    );
    return response.data.data;
  },

  // Lấy phân công theo order ID
  getAssignmentByOrder: async (
    orderId: number
  ): Promise<DeliveryAssignment> => {
    const response = await axiosClient.get(
      `/delivery/assignments/order/${orderId}`
    );
    return response.data.data;
  },

  // Cập nhật trạng thái giao hàng
  updateDeliveryStatus: async (
    assignmentId: number,
    status: DeliveryAssignment["status"]
  ): Promise<DeliveryAssignment> => {
    const response = await axiosClient.put(
      `/delivery/assignments/${assignmentId}/status?status=${status}`
    );
    return response.data.data;
  },

  // Tạo xác nhận giao hàng (với ảnh)
  createDeliveryConfirmation: async (
    data: CreateDeliveryConfirmationRequest
  ): Promise<DeliveryConfirmation> => {
    const response = await axiosClient.post("/delivery-confirmations", data);
    return response.data.data;
  },

  // Quét mã QR
  scanQRCode: async (data: ScanQRRequest): Promise<DeliveryConfirmation> => {
    const response = await axiosClient.post(
      "/delivery-confirmations/scan-qr",
      data
    );
    return response.data.data;
  },

  // Lấy xác nhận giao hàng theo order ID
  getConfirmationByOrder: async (
    orderId: number
  ): Promise<DeliveryConfirmation> => {
    const response = await axiosClient.get(
      `/delivery-confirmations/order/${orderId}`
    );
    return response.data.data;
  },

  // Lấy danh sách xác nhận theo nhân viên
  getConfirmationsByStaff: async (
    deliveryStaffId: string
  ): Promise<DeliveryConfirmation[]> => {
    const response = await axiosClient.get(
      `/delivery-confirmations/staff/${deliveryStaffId}`
    );
    return response.data.data;
  },

  // Chuẩn bị sản phẩm cho giao hàng (STAFF role)
  prepareProducts: async (
    data: PrepareProductsRequest
  ): Promise<DeliveryAssignment> => {
    const response = await axiosClient.post("/delivery/prepare-products", data);
    return response.data.data;
  },

  // Tạo hóa đơn cho đơn hàng (STAFF role)
  generateInvoice: async (orderId: number): Promise<DeliveryAssignment> => {
    const response = await axiosClient.post(
      `/delivery/generate-invoice/${orderId}`
    );
    return response.data.data;
  },
};

export default deliveryService;
