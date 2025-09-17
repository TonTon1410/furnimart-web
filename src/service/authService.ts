import axiosClient from "./axiosClient";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  status: number;
  message: string;
  data: {
    token: string;
    refreshToken: string;
  };
  timestamp: string;
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const res = await axiosClient.post<LoginResponse>("/auth/login", payload);

    const { token, refreshToken } = res.data.data; 
    localStorage.setItem("access_token", token);
    localStorage.setItem("refresh_token", refreshToken);

    return res;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};
