import axiosClient from "./axiosClient";

const warehousesService = {
  // ✅ Lấy danh sách tất cả kho
  getWarehouseList: async () => {
    const url = `/warehouses`;
    return axiosClient.get(url);
  },

  // ✅ Lấy thông tin kho theo ID
  getWarehouseByID: async (warehouseId: string | number) => {
    const url = `/warehouses/${warehouseId}`;
    return axiosClient.get(url);
  },

  // ✅ Lấy thông tin kho theo storeId
  getWarehouseByStore: async (storeId: string | number) => {
    const url = `/warehouses/store/${storeId}`;
    return axiosClient.get(url);
  },

  // ✅ Tìm kiếm kho theo từ khóa
  searchWarehouse: async (keyword: string, page = 0, size = 10) => {
    const url = `/warehouses/search?keyword=${encodeURIComponent(
      keyword
    )}&page=${page}&size=${size}`;
    return axiosClient.get(url);
  },

  // ✅ Tạo mới kho hàng theo storeId
  createWarehouse: async (
    storeId: string | number,
    data: {
      warehouseName: string;
      status: string;
      capacity: number;
    }
  ) => {
    const url = `/warehouses/${storeId}`;
    return axiosClient.post(url, data);
  },

  // ✅ Cập nhật thông tin kho hàng theo storeId và warehouseId
  updateWarehouseInfo: async (
    storeId: string | number,
    warehouseId: string | number,
    data: {
      warehouseName: string;
      status: string;
      capacity: number;
    }
  ) => {
    const url = `/warehouses/${storeId}/${warehouseId}`;
    return axiosClient.put(url, data);
  },

  // ✅ Vô hiệu hóa kho hàng
  disableWarehouse: async (warehouseId: string | number) => {
    const url = `/warehouses/${warehouseId}/disable`;
    return axiosClient.patch(url);
  },

  // ✅ Xóa kho hàng
  deleteWarehouse: async (warehouseId: string | number) => {
    const url = `/warehouses/${warehouseId}`;
    return axiosClient.delete(url);
  },
};

export default warehousesService;
