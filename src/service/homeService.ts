import axios from "axios";

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
    axios.get<ProductResponse>("http://localhost:8084/api/products"),
};
