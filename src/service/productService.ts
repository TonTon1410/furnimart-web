
import axios from "axios";
const API_PRODUCT = import.meta.env.VITE_API_PRODUCT || "http://152.53.169.79:8084/api/";
console.log("API_PRODUCT:", API_PRODUCT);
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  code: string;
  thumbnailImage: string;
  slug: string;
  weight: number;
  height: number;
  width: number;
  length: number;
  status: string;
  categoryName: string;
  materialName: string;
  color: { id: string; colorName: string; hexCode: string }[];
  images: { image: string }[];
  images3d: {
    image3d: string;
    status: string;
    modelUrl: string;
    format: string;
    sizeInMb: number;
    previewImage: string;
  }[];
}

interface ProductResponse {
  status: number;
  message: string;
  data: Product;
}

interface ProductListResponse {
  status: number;
  message: string;
  data: Product[];
}

export const productService = {
  getById: (id: string) => {
    return axios.get<ProductResponse>(`${API_PRODUCT}products/${id}`);
  },
  getBySlug: (slug: string) => {
    const url = `${API_PRODUCT}products/slug/any`;
    // "any" chỉ là placeholder, backend thực tế lấy query param "slug"
    console.log("getBySlug URL:", url, "params:", slug);
    return axios.get<ProductResponse>(url, {
      params: { slug: slug }, // ?slug=ghe%2Fghe-pippa-accent
    });
  },
  getByCategory: (categoryName: string) => {
    return axios.get<ProductListResponse>(`${API_PRODUCT}products/category/${categoryName}`);
  }
};
