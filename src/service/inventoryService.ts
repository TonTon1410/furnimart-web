import axiosClient from "./axiosClient";

// ========================
// 🧱 Kiểu dữ liệu (interface)
// ========================

// Tồn kho cơ bản
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

// Dữ liệu chuyển kho
export interface InventoryTransferData {
  fromWarehouseId: string;
  toWarehouseId: string;
  productColorId: string;
  quantity: number;
  note?: string;
}

// Dữ liệu kiểm tra tồn kho
export interface CheckStockParams {
  productColorId: string;
  locationItemId: string;
  requiredQty: number;
}

// Dữ liệu kiểm tra tồn kho toàn cục
export interface CheckGlobalStockParams {
  productColorId: string;
  requiredQty: number;
}

// ========================
// 📦 Các API
// ========================

const inventoryService = {
  // 🧾 Lấy tất cả inventory
  getInventoryList: async () => {
    return axiosClient.get(`/api/inventories`);
  },

  // 🔍 Lấy inventory theo ID
  getInventoryById: async (inventoryId: string) => {
    return axiosClient.get(`/api/inventories/${inventoryId}`);
  },

  // 🆕 Tạo hoặc cập nhật inventory
  createOrUpdateInventory: async (data: Inventory) => {
    const url = `/api/inventories`;
    return axiosClient.post(url, data);
  },

  // 🔄 Chuyển kho
  transferInventory: async (data: InventoryTransferData) => {
    const url = `/api/inventories/transfer`;
    return axiosClient.post(url, data);
  },

  // ⬆️ Tăng tồn kho
  increaseStock: async (warehouseId: string, productColorId: string, locationItemId: string) => {
    const url = `/api/inventories/${warehouseId}/${productColorId}/${locationItemId}/increase`;
    return axiosClient.patch(url);
  },

  // ⬇️ Giảm tồn kho
  decreaseStock: async (warehouseId: string, productColorId: string, locationItemId: string) => {
    const url = `/api/inventories/${warehouseId}/${productColorId}/${locationItemId}/decrease`;
    return axiosClient.patch(url);
  },

  // 🔒 Dự trữ tồn kho (Reserve)
  reserveStock: async (productColorId: string) => {
    const url = `/api/inventories/reserve/${productColorId}`;
    return axiosClient.patch(url);
  },

  // 🔓 Giải phóng tồn kho (Release)
  releaseStock: async (productColorId: string) => {
    const url = `/api/inventories/release/${productColorId}`;
    return axiosClient.patch(url);
  },

  // ✅ Kiểm tra tồn kho cục bộ
  checkStock: async ({ productColorId, locationItemId, requiredQty }: CheckStockParams) => {
    const url = `/api/inventories/${productColorId}/${locationItemId}/check-stock`;
    return axiosClient.get(url, { params: { requiredQty } });
  },

  // 🌍 Kiểm tra tồn kho toàn cục
  checkGlobalStock: async ({ productColorId, requiredQty }: CheckGlobalStockParams) => {
    const url = `/api/inventories/${productColorId}/check-global-stock`;
    return axiosClient.get(url, { params: { requiredQty } });
  },

  // 🏷️ Lấy danh sách inventory theo Location Item
  getInventoryByLocationItem: async (locationItemId: string) => {
    return axiosClient.get(`/api/inventories/location-item/${locationItemId}`);
  },

  // 🏷️ Lấy danh sách inventory theo Zone
  getInventoryByZone: async (zoneId: string) => {
    return axiosClient.get(`/api/inventories/zone/${zoneId}`);
  },

  // ⚖️ Kiểm tra sức chứa của Zone
  checkZoneCapacity: async (zoneId: string) => {
    return axiosClient.get(`/api/inventories/zone/${zoneId}/check-capacity`);
  },

  // 🕓 Lịch sử giao dịch tồn kho
  getAllTransactions: async () => {
    return axiosClient.get(`/api/inventories/transactions`);
  },

  // 📜 Lịch sử giao dịch theo product + zone
  getTransactionHistory: async (productColorId: string, zoneId: string) => {
    const url = `/api/inventories/transaction-history/${productColorId}/${zoneId}`;
    return axiosClient.get(url);
  },

  // 📊 Tổng tồn kho vật lý
  getTotalPhysical: async (productColorId: string) => {
    return axiosClient.get(`/api/inventories/total-physical/${productColorId}`);
  },

  // 📈 Tổng tồn kho khả dụng
  getTotalAvailable: async (productColorId: string) => {
    return axiosClient.get(`/inventories/stock/total-available`, {
      params: { productColorId },
    });
  },

  // 🎨 Lấy danh sách inventory theo ProductColor
  getInventoryByProductColor: async (productColorId: string) => {
    return axiosClient.get(`/api/inventories/productColorId/${productColorId}`);
  },
};

export default inventoryService;
