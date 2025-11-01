// src/pages/ProductDetail.tsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import RightSection from "../components/productDetail/RightSection";
import LeftSection from "../components/productDetail/LeftSection";
import BottomSection from "../components/productDetail/BottomSection";
import { productService } from "../service/productService";
import type { Product as ProductType } from "../service/productService";
import inventoryService from "../service/inventoryService";
import NotFound from "./NotFound";
import LoadingPage from "./LoadingPage";

type Product = ProductType;

const isValidUrl = (url?: string) =>
  !!url && (url.startsWith("http://") || url.startsWith("https://"));

const ProductDetail: React.FC = () => {
  const location = useLocation();
  const slug = location.pathname.replace("/product/", "");
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [availableStock, setAvailableStock] = useState<number | null>(null);

  // Nếu sản phẩm chỉ có 1 màu thì tự chọn
  useEffect(() => {
    if (product?.productColors?.length === 1) {
      setSelectedColorId(product.productColors[0].id);
    }
  }, [product]);

  // Load tồn kho khi chọn màu
  useEffect(() => {
    if (!selectedColorId) {
      setAvailableStock(null);
      return;
    }

    const fetchStock = async () => {
      try {
        const res = await inventoryService.getTotalAvailable(selectedColorId);
        if (res?.data?.data !== undefined) {
          setAvailableStock(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching stock:", err);
        setAvailableStock(null);
      }
    };

    fetchStock();
  }, [selectedColorId]);

  // Lấy sản phẩm cùng danh mục trừ chính nó
  const getRelatedProducts = async (
    categoryId: number,
    productId: string
  ): Promise<Product[]> => {
    if (!categoryId) return [];
    try {
      const res = await productService.getByCategory(categoryId);
      if (Array.isArray(res?.data?.data)) {
        return res.data.data.filter((p: Product) => p.id !== productId);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };

  // Lấy dữ liệu chính
  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      try {
        const res = await productService.getBySlug(slug);
        if (res?.data?.data) {
          const p = res.data.data;
          setProduct(p);

          if (typeof p.categoryId === "number") {
            const relatedRes = await getRelatedProducts(p.categoryId, p.id);
            setRelated(relatedRes);
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      }
    };
    fetchData();
  }, [slug]);

  if (!slug) return <NotFound />;
  if (!product) return <LoadingPage />;

  // Gom tất cả ảnh hợp lệ
  const allColorImages =
    product.productColors?.flatMap(
      (pc) =>
        pc.images?.map((img) => img.image).filter((i) => isValidUrl(i)) || []
    ) || [];

  // Gom ảnh preview 3D (nếu có)
  const all3DPreviews =
    product?.productColors?.flatMap((color) =>
      (color.models3D || [])
        .filter(
          (m) => m.status === "ACTIVE" && m.modelUrl && m.modelUrl !== "string"
        )
        .map((m) => ({
          modelUrl: m.modelUrl,
          previewImage: m.previewImage,
          format: m.format,
        }))
    ) || [];

  // Ảnh của màu đang chọn (nếu có)
  const selectedColorImages =
    selectedColorId && product.productColors
      ? product.productColors
          .find((pc) => pc.id === selectedColorId)
          ?.images?.map((img) => img.image)
          .filter((img) => isValidUrl(img)) || []
      : [];

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto py-4 md:py-10 px-2 md:px-8">
        {/* Khung hình ảnh + thông tin */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-10 rounded-xl md:rounded-2xl bg-white shadow-lg p-4 md:p-8">
          {/* Hình ảnh bên trái */}
          <div className="md:col-span-7">
            <RightSection
              thumbnailImage={
                isValidUrl(product.thumbnailImage)
                  ? product.thumbnailImage
                  : "/default-image.png"
              }
              images={allColorImages}
              images3d={all3DPreviews}
              selectedColorImages={selectedColorImages}
            />
          </div>

          {/* Thông tin + giỏ hàng */}
          <div className="md:col-span-5">
            <LeftSection
              product={product}
              selectedColorId={selectedColorId}
              onColorChange={setSelectedColorId}
              availableStock={availableStock}
            />
          </div>
        </div>

        {/* Mô tả, thông tin chi tiết, sản phẩm liên quan */}
        <div className="mt-12">
          <BottomSection
            related={related.map((item) => ({
              id: item.id,
              slug: item.slug, // giữ đúng slug thật từ API
              name: item.name,
              price: item.price,
              description: item.description,
              thumbnailImage: isValidUrl(item.thumbnailImage)
                ? item.thumbnailImage
                : "/default-image.png",
              categoryName: item.categoryName,
              materials: item.materials,
              height: item.height,
              width: item.width,
              length: item.length,
              weight: item.weight,
            }))}
            product={product}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
