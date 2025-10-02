// src/pages/ProductDetail.tsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import RightSection from "../components/productDetail/RightSection";
import LeftSection from "../components/productDetail/LeftSection";
import BottomSection from "../components/productDetail/BottomSection";
import { productService } from "../service/productService";
import type { Product as ProductType } from "../service/productService";
import NotFound from "./NotFound";
import LoadingPage from "./LoadingPage";

type Product = ProductType;

// ✅ helper để kiểm tra URL hợp lệ
const isValidUrl = (url?: string) =>
  !!url && (url.startsWith("http://") || url.startsWith("https://"));

const ProductDetail: React.FC = () => {
  const location = useLocation();
  const slug = location.pathname.replace("/product/", "");
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  useEffect(() => {
    if (product?.color?.length === 1) {
      setSelectedColorId(product.color[0].id);
    }
  }, [product]);

  const getRelatedProducts = async (
    categoryId: number,
    productId: string
  ): Promise<Product[]> => {
    if (!categoryId) return [];
    try {
      const res = await productService.getByCategory(categoryId);
      if (Array.isArray(res?.data?.data)) {
        // loại bỏ sản phẩm đang hiển thị
        return res.data.data.filter((p: Product) => p.id !== productId);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        const res = await productService.getBySlug(slug);
        if (res?.data?.data) {
          setProduct(res.data.data);
          if (typeof res.data.data.categoryId === "number") {
            const relatedRes = await getRelatedProducts(
              res.data.data.categoryId,
              res.data.data.id
            );
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

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto py-10 px-4 md:px-8">
        {/* Khung chung cho Right + Left */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 rounded-2xl bg-white shadow-lg p-8">
          {/* Hình ảnh */}
          <div className="md:col-span-7">
            <RightSection
              thumbnailImage={
                isValidUrl(product.thumbnailImage)
                  ? product.thumbnailImage
                  : "/default-image.png"
              }
              images={
                product.color?.flatMap(
                  (c) =>
                    c.images
                      ?.map((img) => img.image)
                      .filter((img) => isValidUrl(img)) || []
                ) || []
              }
              images3d={
                product.color?.flatMap(
                  (c) =>
                    c.models3D
                      ?.map((m) => ({
                        previewImage: m.previewImage,
                      }))
                      .filter((m) => isValidUrl(m.previewImage)) || []
                ) || []
              }
              selectedColorImages={
                selectedColorId
                  ? product.color
                      .find((c) => c.id === selectedColorId)
                      ?.images?.map((img) => img.image)
                      .filter((img) => isValidUrl(img)) || []
                  : []
              }
            />
          </div>

          {/* Thông tin */}
          <div className="md:col-span-5">
            <LeftSection
              product={product}
              selectedColorId={selectedColorId}
              onColorChange={setSelectedColorId}
            />
          </div>
        </div>

        {/* Khung mô tả + chi tiết + liên quan */}
        <div className="mt-12">
          <BottomSection
            related={related.map((item) => ({
              id: item.id,
              slug: item.slug,
              name: item.name,
              price: item.price,
              description: item.description,
              thumbnailImage: isValidUrl(item.thumbnailImage)
                ? item.thumbnailImage
                : "/default-image.png",
            }))}
            product={{
              ...product!,
              images:
                product!.images
                  ?.map((img) => img.image)
                  .filter((img) => isValidUrl(img)) || ["/default-image.png"],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
