import axiosClient from "./axiosClient";

const locationItemService = {
  // ✅ Lấy danh sách vị trí theo Zone ID
  getLocationByZone: async (zoneId: string | number) => {
    const url = `/location-items/zone/${zoneId}`;
    return axiosClient.get(url);
  },

  // ✅ Lấy chi tiết một Location Item theo ID
  getLocationByID: async (locationItemId: string | number) => {
    const url = `/location-items/${locationItemId}`;
    return axiosClient.get(url);
  },

  // ✅ Tìm kiếm Location Item theo keyword (có phân trang)
  searchLocationItem: async (keyword: string, page = 0, size = 10) => {
    const url = `/location-items/search?keyword=${encodeURIComponent(
      keyword
    )}&page=${page}&size=${size}`;
    return axiosClient.get(url);
  },


  // ✅ Tạo mới Location Item
  createLocationItem: async (data: {
    zoneId: string;
    rowLabel: string;
    columnNumber: number;
    code: string;
    status: "ACTIVE" | "INACTIVE";
    description: string;
  }) => {
    const url = `/location-items`;
    return axiosClient.post(url, data);
  },

  // ✅ Cập nhật Location Item theo ID
  updateLocationItem: async (
    locationItemId: string | number,
    data: {
      zoneId: string;
      rowLabel: string;
      columnNumber: number;
      code: string;
      status: "ACTIVE" | "INACTIVE";
      description: string;
    }
  ) => {
    const url = `/location-items/${locationItemId}`;
    return axiosClient.put(url, data);
  },

  // ✅ Vô hiệu hóa Location Item (disable)
  disableLocationItem: async (locationItemId: string | number) => {
    const url = `/location-items/${locationItemId}/disable`;
    return axiosClient.patch(url);
  },

  // ✅ Xóa Location Item
  deleteLocationItem: async (locationItemId: string | number) => {
    const url = `/location-items/${locationItemId}`;
    return axiosClient.delete(url);
  },
};

export default locationItemService;
