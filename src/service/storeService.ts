import axiosClient from "./axiosClient";

// 🏪 Store Service — quản lý các API liên quan đến cửa hàng
const storeService = {
  // ✅ Lấy tất cả cửa hàng
  getAllStores: async () => {
    const url = `/stores`;
    return axiosClient.get(url);
  },

  // ✅ Lấy chi tiết cửa hàng theo ID
  getStoreById: async (id: string) => {
    const url = `/stores/${id}`;
    return axiosClient.get(url);
  },

  // ✅ Lấy danh sách người dùng theo storeId
  getUsersByStoreId: async (storeId: string) => {
    const url = `/stores/${storeId}/users`;
    return axiosClient.get(url);
  },

  // ✅ Lấy danh sách cửa hàng theo userId
  getStoresByUserId: async (userId: string) => {
    const url = `/stores/users/${userId}`;
    return axiosClient.get(url);
  },

  // ✅ Tìm kiếm cửa hàng theo từ khóa
  searchStores: async (searchTerm: string) => {
    const url = `/stores/search?searchTerm=${encodeURIComponent(searchTerm)}`;
    return axiosClient.get(url);
  },

  // ✅ Phân trang danh sách cửa hàng
  getStoresPaginated: async (params: {
    page: number;
    size: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }) => {
    const { page, size, sortBy, sortDirection } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      ...(sortBy ? { sortBy } : {}),
      ...(sortDirection ? { sortDirection } : {}),
    });
    const url = `/stores/paginated?${query.toString()}`;
    return axiosClient.get(url);
  },

  // ✅ Lấy danh sách cửa hàng gần nhất theo tọa độ
  getNearestStores: async (lat: number, lon: number, limit?: number) => {
    const query = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      ...(limit ? { limit: String(limit) } : {}),
    });
    const url = `/stores/nearest/list?${query.toString()}`;
    return axiosClient.get(url);
  },

  // ✅ Lấy danh sách cửa hàng theo quận/huyện
  getStoresByDistrict: async (district: string) => {
    const url = `/stores/district/${district}`;
    return axiosClient.get(url);
  },

  // ✅ Lấy danh sách cửa hàng theo thành phố
  getStoresByCity: async (city: string) => {
    const url = `/stores/city/${city}`;
    return axiosClient.get(url);
  },

  // ✅ Tạo mới cửa hàng
  createStore: async (data: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    city?: string;
    district?: string;
    ward?: string;
    latitude?: number;
    longitude?: number;
    status?: "ACTIVE" | "INACTIVE";
  }) => {
    const url = `/stores`;
    return axiosClient.post(url, data);
  },

  // ✅ Cập nhật thông tin cửa hàng
  updateStore: async (
    id: string,
    data: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
      city?: string;
      district?: string;
      ward?: string;
      latitude?: number;
      longitude?: number;
      status?: "ACTIVE" | "INACTIVE";
    }
  ) => {
    const url = `/stores/${id}`;
    return axiosClient.put(url, data);
  },

  // ✅ Xóa cửa hàng theo ID
  deleteStore: async (id: string) => {
    const url = `/stores/${id}`;
    return axiosClient.delete(url);
  },

  // ✅ Gán người dùng vào cửa hàng
  addUserToStore: async (data: { userId: string; storeId: string }) => {
    const url = `/stores/users`;
    return axiosClient.post(url, data);
  },

  // ✅ Xóa người dùng khỏi cửa hàng
  removeUserFromStore: async (storeId: string, userId: string) => {
    const url = `/stores/${storeId}/users/${userId}`;
    return axiosClient.delete(url);
  },
};

export default storeService;
