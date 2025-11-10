import axios from "axios";
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://152.53.169.79:8080/api";

export interface Product {
  categoryId: number;
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
  userId: string | null;
  fullName: string | null;
  productColors?: {
    id: string;
    color: {
      id: string;
      colorName: string;
      hexCode: string;
    };
    images?: {
      id: string;
      image: string;
    }[];
    models3D?: {
      status: string;
      modelUrl: string;
      format: string;
      previewImage?: string;
    }[];
    status: string;
  }[];
  materials?: {
    id: number;
    image: string;
    materialName: string;
    description: string | null;
    status: string;
  }[];
  // Legacy fields for backward compatibility
  materialName?: string;
  color?: { id: string; colorName: string; hexCode: string }[];
  images?: { image: string }[];
  images3d?: {
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

export interface ProductColor {
  id: string;
  product: Product;
  color: {
    id: string;
    colorName: string;
    hexCode: string;
  };
  images: {
    id: string;
    image: string;
  }[];
  models3D: {
    image3d: string;
    status: string;
    modelUrl: string;
    format: string;
    sizeInMb: number;
    previewImage: string;
  }[];
  status: string;
}

interface ProductColorResponse {
  status: number;
  message: string;
  data: ProductColor;
  timestamp: string;
}

export const productService = {
  getById: (id: string) => {
    return axios.get<ProductResponse>(`${BASE_URL}/products/${id}`);
  },
  getBySlug: (slug: string) => {
    const url = `${BASE_URL}/products/slug/any`;
    return axios.get<ProductResponse>(url, {
      params: { slug: slug },
    });
  },
  getByCategory: (categoryId: number) => {
    return axios.get<ProductResponse>(
      `${BASE_URL}/products/category/${categoryId}`
    );
  },
  getProductColorById: (id: string) => {
    return axios.get<ProductColorResponse>(`${BASE_URL}/product-colors/${id}`);
  },
};
