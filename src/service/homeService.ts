import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://152.53.169.79:8080/api";
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
  data: Product[];
}

export const productService = {
  getAll: () =>
    axios.get<ProductResponse>(`${BASE_URL}/products`),
};

