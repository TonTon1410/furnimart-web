import axiosClient from "./axiosClient";

const zoneService = {
  // ✅ Lấy danh sách zone theo warehouseId
  getZoneByWarehouse: async (warehouseId: string | number) => {
    const url = `/zones/warehouse/${warehouseId}`;
    return axiosClient.get(url);
  },

  // ✅ Lấy thông tin chi tiết zone theo ID
  getZoneByID: async (zoneId: string | number) => {
    const url = `/zones/${zoneId}`;
    return axiosClient.get(url);
  },

  // ✅ Tìm kiếm zone theo từ khóa
  searchZone: async (keyword: string, page = 0, size = 10) => {
    const url = `/zones/search?keyword=${encodeURIComponent(
      keyword
    )}&page=${page}&size=${size}`;
    return axiosClient.get(url);
  },

  // ✅ Tạo mới zone
  createZone: async (data: {
    zoneName: string;
    description: string;
    status: string;
    zoneCode: string;
    quantity: number;
    warehouseId: string | number;
  }) => {
    const url = `/zones`;
    return axiosClient.post(url, data);
  },

  // ✅ Cập nhật zone theo ID
  updateZone: async (
    zoneId: string | number,
    data: {
      zoneName: string;
      description: string;
      status: string;
      zoneCode: string;
      quantity: number;
      warehouseId: string | number;
    }
  ) => {
    const url = `/zones/${zoneId}`;
    return axiosClient.put(url, data);
  },

  // ✅ Vô hiệu hóa zone
  disableZone: async (zoneId: string | number) => {
    const url = `/zones/${zoneId}/disable`;
    return axiosClient.patch(url);
  },

  // ✅ Xóa zone
  deleteZone: async (zoneId: string | number) => {
    const url = `/zones/${zoneId}`;
    return axiosClient.delete(url);
  },
};

export default zoneService;
