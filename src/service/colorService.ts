import axios from "axios";

// Colors API ở port 8080 (API Gateway hoặc Product Service)
const COLORS_API_BASE_URL = "http://152.53.169.79:8080/api";

console.log("🎨 Colors API Base URL:", COLORS_API_BASE_URL);

const colorApiClient = axios.create({
  baseURL: COLORS_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Add auth token interceptor
colorApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export type Color = {
  id: string;
  colorName: string;
  hexCode: string;
};

export type ColorFormData = {
  colorName: string;
  hexCode: string;
};

export type ColorResponse = {
  status: number;
  message: string;
  data: Color | Color[];
  timestamp: string;
};

export const colorService = {
  /**
   * GET /api/colors - Lấy danh sách tất cả màu (chưa bị xóa)
   */
  getAll: async (): Promise<Color[]> => {
    const response = await colorApiClient.get<ColorResponse>("/colors");
    return Array.isArray(response.data.data) ? response.data.data : [];
  },

  /**
   * POST /api/colors - Thêm màu mới
   */
  create: async (data: ColorFormData): Promise<Color> => {
    const response = await colorApiClient.post<ColorResponse>("/colors", data);
    return response.data.data as Color;
  },

  /**
   * PUT /api/colors/{id} - Cập nhật thông tin màu
   */
  update: async (id: string, data: ColorFormData): Promise<Color> => {
    const response = await colorApiClient.put<ColorResponse>(
      `/colors/${id}`,
      data
    );
    return response.data.data as Color;
  },

  /**
   * DELETE /api/colors/{id} - Xóa mềm màu (isDeleted = true)
   */
  delete: async (id: string): Promise<void> => {
    await colorApiClient.delete(`/colors/${id}`);
  },
};

export default colorService;
