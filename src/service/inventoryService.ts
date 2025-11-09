/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosClient from "./axiosClient";

// ========================
// 🧱 Kiểu dữ liệu (interface)
// ========================

// Tồn kho cơ bản - KHÔNG THAY ĐỔI
export interface Inventory {
  id?: string;
  warehouseId: string;
  productColorId: string;
  locationItemId: string;
  physicalQty: number;
  reservedQty: number;
  availableQty: number;
  description?: string;
}

// Dữ liệu chuyển kho - CẬP NHẬT TỪ SWAGGER
export interface InventoryTransferData {
  productColorId: string;
  fromWarehouseId: string;
  fromZoneId?: string; // Thêm theo Swagger
  fromLocationItemId?: string; // Thêm theo Swagger
  toWarehouseId: string;
  toZoneId?: string; // Thêm theo Swagger
  toLocationItemId?: string; // Thêm theo Swagger
  quantity: number;
  note?: string; // Bỏ đi vì không có trong request body của Swagger POST /transfer
}

// Dữ liệu tạo phiếu nhập/xuất/đặt/giải phóng
export interface ImportExportReserveReleaseData {
  quantity: number;
  productColorId: string;
  locationItemId: string;
}

// Dữ liệu kiểm tra tồn kho (tồn kho tại kho) - CẬP NHẬT THEO SWAGGER
export interface CheckWarehouseStockParams {
  productColorId: string;
  warehouseId: string; // Thêm theo Swagger
  requiredQty: number;
}

// Dữ liệu kiểm tra tồn kho toàn cục - CẬP NHẬT THEO SWAGGER
export interface CheckGlobalStockParams {
  productColorId: string;
  requiredQty: number;
}

// Dữ liệu thêm item vào phiếu kho
export interface AddItemToInventoryData {
  quantity: number;
  productColorId: string;
  locationItemId: string;
}

// Dữ liệu lấy lịch sử giao dịch
export interface GetTransactionHistoryParams {
  productColorId: string;
  zoneId?: string; // Optional theo Swagger
}

// ========================
// 📦 Các API
// ========================

const inventoryService = {
  // 🧾 Lấy tất cả inventory (phiếu kho)
  getInventoryList: async () => {
    return axiosClient.get(`/api/inventories`);
  },

  // 🔍 Lấy inventory (phiếu kho) theo ID
  getInventoryById: async (inventoryId: string) => {
    return axiosClient.get(`/api/inventories/${inventoryId}`);
  },

  // 🆕 Tạo hoặc cập nhật inventory (phiếu kho)
  createOrUpdateInventory: async (data: any) => { // Cập nhật data type cho khớp schema trong Swagger POST /api/inventories
    const url = `/api/inventories`;
    return axiosClient.post(url, data);
  },

  // 🔄 Chuyển kho (Tạo phiếu TRANSFER)
  transferInventory: async (data: InventoryTransferData) => {
    const url = `/api/inventories/transfer`;
    return axiosClient.post(url, data);
  },

  // ⬆️ Tạo phiếu nhập (IMPORT)
  importStock: async (warehouseId: string, data: ImportExportReserveReleaseData) => {
    const url = `/api/inventories/${warehouseId}/import`;
    return axiosClient.post(url, data);
  },

  // ⬇️ Tạo phiếu xuất (EXPORT)
  exportStock: async (warehouseId: string, data: ImportExportReserveReleaseData) => {
    const url = `/api/inventories/${warehouseId}/export`;
    return axiosClient.post(url, data);
  },

  // 🔒 Dự trữ tồn kho (Tạo phiếu RESERVE)
  reserveStock: async (data: ImportExportReserveReleaseData) => {
    const url = `/api/inventories/reserve`;
    return axiosClient.post(url, data);
  },

  // 🔓 Giải phóng tồn kho (Tạo phiếu RELEASE)
  releaseStock: async (data: ImportExportReserveReleaseData) => {
    const url = `/api/inventories/release`;
    return axiosClient.post(url, data);
  },

  // ➕ Thêm chi tiết Item vào Phiếu kho
  addItemToInventory: async (inventoryId: string | number, data: AddItemToInventoryData) => {
    const url = `/api/inventories/inventory/${inventoryId}/items`;
    return axiosClient.post(url, data);
  },

  // 🏷️ Lấy danh sách phiếu kho theo Zone ID
  getInventoryByZone: async (zoneId: string) => {
    return axiosClient.get(`/api/inventories/zone/${zoneId}`);
  },

  // 🏷️ Lấy danh sách phiếu kho theo Warehouse ID
  getInventoryByWarehouse: async (warehouseId: string) => {
    return axiosClient.get(`/api/inventories/warehouse/${warehouseId}`);
  },

  // ⚖️ Kiểm tra sức chứa của Zone (THAY ĐỔI: thêm additionalQty là Query Param)
  checkZoneCapacity: async (zoneId: string, additionalQty: number) => {
    const url = `/api/inventories/zone/${zoneId}/check-capacity`;
    return axiosClient.get(url, { params: { additionalQty } });
  },

  // 📊 Tổng tồn kho vật lý (THAY ĐỔI: dùng query param `productColorId`)
  getTotalPhysical: async (productColorId: string) => {
    const url = `/api/inventories/stock/total-physical`;
    return axiosClient.get(url, { params: { productColorId } });
  },

  // 📈 Tổng tồn kho khả dụng (THAY ĐỔI: dùng endpoint và query param mới)
  getTotalAvailable: async (productColorId: string) => {
    const url = `/api/inventories/stock/total-available`;
    return axiosClient.get(url, { params: { productColorId } });
  },

  // ✅ Kiểm tra tồn kho tại kho (THAY ĐỔI: dùng endpoint và query params mới)
  checkWarehouseStock: async ({ productColorId, warehouseId, requiredQty }: CheckWarehouseStockParams) => {
    const url = `/api/inventories/stock/check-warehouse`;
    return axiosClient.get(url, { params: { productColorId, warehouseId, requiredQty } });
  },

  // 🌍 Kiểm tra tồn kho toàn cục (THAY ĐỔI: dùng endpoint và query params mới)
  checkGlobalStock: async ({ productColorId, requiredQty }: CheckGlobalStockParams) => {
    const url = `/api/inventories/stock/check-global`;
    return axiosClient.get(url, { params: { productColorId, requiredQty } });
  },

  // 📝 Lấy tất cả Chi Tiết Phiếu Kho
  getAllInventoryItems: async () => {
    return axiosClient.get(`/api/inventories/items`);
  },

  // 🎨 Lấy Chi Tiết Giao Dịch theo ProductColorId
  getInventoryItemsByProductColor: async (productColorId: string) => {
    return axiosClient.get(`/api/inventories/items/product/${productColorId}`);
  },

  // 📜 Lịch sử giao dịch theo product + zone (THAY ĐỔI: dùng endpoint và query params mới)
  getTransactionHistory: async ({ productColorId, zoneId }: GetTransactionHistoryParams) => {
    const url = `/api/inventories/items/history`;
    return axiosClient.get(url, { params: { productColorId, zoneId } });
  },
  
  // Các API cũ bị loại bỏ:
  // - getInventoryByLocationItem: Không thấy trong Swagger.
  // - increaseStock/decreaseStock (PATCH): Đã được thay thế bằng các API POST import/export, reserve/release (Tạo phiếu).
  // - reserveStock/releaseStock (PATCH): Đã được thay thế bằng các API POST /reserve và /release (Tạo phiếu).
  // - checkStock: Đã được thay thế bằng checkWarehouseStock (Kiểm tra theo Kho).
  // - getAllTransactions: Đã được thay thế bằng getTransactionHistory.
};

export default inventoryService;