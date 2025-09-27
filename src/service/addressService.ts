import axiosClient from './axiosClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://152.53.169.79:8080/api';

export const addressService = {
  createAddress: async (data: {
    name: string;
    phone: string;
    city: string;
    district: string;
    ward: string;
    street: string;
    addressLine: string;
    isDefault: boolean;
    userId: string;
  }) => {
    return axiosClient.post(`${API_BASE_URL}/addresses`, data);
  },

  getAddressById: async (id: string) => {
    return axiosClient.get(`${API_BASE_URL}/addresses/${id}`);
  },

  getAllAddresses: async () => {
    return axiosClient.get(`${API_BASE_URL}/addresses`);
  },

  getAddressesByUserId: async (userId: string) => {
    return axiosClient.get(`${API_BASE_URL}/addresses/user/${userId}`);
  },
};
