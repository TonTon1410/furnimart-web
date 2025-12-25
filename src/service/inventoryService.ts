import axiosClient from "./axiosClient";

// ========================
// 🧱 Kiểu dữ liệu (Interfaces Request & Response)
// ========================

// --- REQUEST INTERFACES (Gửi đi) ---

// Item chi tiết trong phiếu kho (khi tạo)
export interface InventoryItemRequest {
  quantity: number;
  productColorId: string;
  locationItemId: string;
}

// Payload tạo hoặc cập nhật phiếu kho
export interface CreateInventoryRequest {
  id?: number; // Default 0 nếu tạo mới
  type: string; // VD: "IN", "OUT", "TRANSFER"
  purpose: string; // VD: "STOCK_IN", "BS_STOCK", "TRANSFER"
  note?: string;
  warehouseId?: string; // Kho nguồn / Kho tác động
  toWarehouseId?: string; // Kho đích (nếu là chuyển kho)
  orderId?: number;
  transferId?: string; // ID của phiếu chuyển (nếu là nhập từ transfer)
  items: InventoryItemRequest[];
}

export interface CheckWarehouseStockParams {
  productColorId: string;
  warehouseId: string;
  requiredQty: number;
}

export interface CheckGlobalStockParams {
  productColorId: string;
  requiredQty: number;
}

export interface GetLocationsByWarehouseParams {
  productColorId: string;
  storeId: string;
}

// --- RESPONSE INTERFACES (Nhận về - Mới thêm dựa trên JSON) ---

// Chi tiết vị trí trong item trả về
export interface LocationItemResponse {
  id: string;
  code: string;
  description: string;
  rowLabel: number;
  columnNumber: number;
  status: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

// Chi tiết sản phẩm trong phiếu kho trả về
export interface InventoryItemResponse {
  id: number;
  inventoryId: number;
  quantity: number;
  reservedQuantity: number;
  productColorId: string;
  productName: string;
  locationItem: LocationItemResponse;
}

// Dữ liệu chính của một phiếu kho (Inventory) trả về từ API danh sách
export interface InventoryResponse {
  id: number;
  employeeId: string;
  type: string; // "IN", "OUT"...
  purpose: string; // "STOCK_IN"...
  date: string; // "2025-11-23"
  note: string;
  warehouseName: string;
  warehouseId: string;
  toWarehouseName?: string;
  toWarehouseId?: string;
  orderId: number;
  pdfUrl?: string;
  totalQuantity?: number;
  transferStatus?: string;
  itemResponseList: InventoryItemResponse[];
  reservedWarehouses?: ReservedWarehouse[];
  assignedWarehouse?: boolean;
}

// Response từ API warehouse view
export interface WarehouseViewResponse {
  warehouseId: string;
  localTickets: InventoryResponse[];
  globalTickets: InventoryResponse[];
}

export interface InventoryLocationDetail {
  warehouseId: string;
  warehouseName: string;
  zoneId: string;
  zoneName: string;
  locationItemId: string;
  locationCode: string;
  totalQuantity: number;
  reserved: number;
  available: number;
}

// Thông tin kho đã giữ cho phiếu
export interface ReservedWarehouse {
  warehouseId: string;
  warehouseName: string;
  reservedQuantity: number;
  assignedWarehouse: boolean;
}

// Chi tiết sản phẩm trong phiếu giữ hàng
export interface ReservedItemResponse {
  id: number;
  quantity: number;
  productColorId: string;
  productName: string;
  reservedQuantity: number;
  locationItem: LocationItemResponse | null;
  locationId: string;
  inventoryId: number;
}

// Phiếu giữ hàng đang chờ xử lý
export interface PendingReservationResponse {
  id: number;
  employeeId: string;
  type: string;
  purpose: string;
  date: string;
  note: string;
  warehouseName: string;
  warehouseId: string;
  orderId: number;
  pdfUrl: string | null;
  transferStatus: string | null;
  itemResponseList: ReservedItemResponse[];
}

// ========================
// 📦 Các API
// ========================

const inventoryService = {
  // 🧾 Lấy tất cả inventory (phiếu kho)
  getInventoryList: async () => {
    return axiosClient.get(`/inventories`);
  },

  // 🏭 Lấy danh sách Phiếu Kho theo Warehouse ID (MỚI THÊM)
  getInventoriesByWarehouse: async (warehouseId: string) => {
    return axiosClient.get(`/inventories/warehouse/${warehouseId}`);
  },

  // 🔍 Lấy chi tiết inventory theo ID
  getInventoryById: async (inventoryId: string) => {
    return axiosClient.get(`/inventories/${inventoryId}`);
  },

  // 🆕 Tạo hoặc cập nhật inventory
  createOrUpdateInventory: async (data: CreateInventoryRequest) => {
    return axiosClient.post(`/inventories`, data);
  },

  // 📍 Lấy vị trí chứa sản phẩm trong kho
  getLocationsByWarehouse: async ({
    productColorId,
    storeId,
  }: GetLocationsByWarehouseParams) => {
    return axiosClient.get(`/inventories/stock/locations/by-warehouse`, {
      params: { productColorId, storeId },
    });
  },

  // ------------------------- KIỂM KHO (STOCK CHECKS) -------------------------

  // 📊 Tổng tồn kho vật lý
  getTotalPhysical: async (productColorId: string) => {
    return axiosClient.get(`/inventories/stock/total-physical`, {
      params: { productColorId },
    });
  },

  // 📈 Tổng tồn kho khả dụng
  getTotalAvailable: async (productColorId: string) => {
    return axiosClient.get(`/inventories/stock/total-available`, {
      params: { productColorId },
    });
  },

  // ✅ Kiểm tra tồn kho tại một kho cụ thể
  checkWarehouseStock: async ({
    productColorId,
    warehouseId,
    requiredQty,
  }: CheckWarehouseStockParams) => {
    return axiosClient.get(`/inventories/stock/check-warehouse`, {
      params: { productColorId, warehouseId, requiredQty },
    });
  },

  // 🌍 Kiểm tra tồn kho toàn hệ thống
  checkGlobalStock: async ({
    productColorId,
    requiredQty,
  }: CheckGlobalStockParams) => {
    return axiosClient.get(`/inventories/stock/check-global`, {
      params: { productColorId, requiredQty },
    });
  },

  // 📍 Lấy tất cả vị trí chứa productColorId (warehouse → zone → location)
  getAllStockLocations: async (productColorId: string) => {
    return axiosClient.get(`/inventories/stock/locations/all`, {
      params: { productColorId },
    });
  },

  // 🔄 Lấy danh sách yêu cầu chuyển kho đang chờ duyệt
  getPendingTransfers: async (warehouseId: string) => {
    return axiosClient.get(`/inventories/transfer/pending/${warehouseId}`);
  },

  // ✅ Duyệt hoặc từ chối phiếu chuyển kho
  approveOrRejectTransfer: async (
    inventoryId: number,
    transferStatus:
      | "PENDING"
      | "ACCEPTED"
      | "CANCELLED"
      | "FINISHED"
      | "REJECTED"
  ) => {
    return axiosClient.post(
      `/inventories/transfer/${inventoryId}/approve`,
      null,
      {
        params: { transferStatus },
      }
    );
  },

  // 📦 Lấy danh sách phiếu giữ hàng đang chờ xử lý theo Store ID
  getPendingReservations: async (storeId: string) => {
    return axiosClient.get(`/inventories/reserve/pending`, {
      params: { storeId },
    });
  },

  // 📋 Lấy view phiếu kho cho 1 warehouse (local + global RESERVE)
  getWarehouseView: async (warehouseId: string) => {
    return axiosClient.get(`/inventories/warehouse/view`, {
      params: { warehouseId },
    });
  },

  // 🚫 Hủy phiếu giữ hàng
  cancelReserveTicket: async (ticketId: number) => {
    return axiosClient.delete(`/inventories/cancel/ticket/${ticketId}`);
  },
};

export default inventoryService;
