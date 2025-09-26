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
        // Loại bỏ sản phẩm đang hiển thị
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
    <div className="flex flex-col items-center min-h-screen bg-white">
      <div className="h-15" />
      <div className="w-full max-w-6xl mx-auto">
        {/* Khung chung cho Right + Left */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border border-gray-300 bg-white shadow-sm p-6">
          {/* Hình ảnh lớn hơn */}
          <div className="md:col-span-7">
            <RightSection
              thumbnailImage={product.thumbnailImage || "/default-image.png"}
              images={
                product.color?.flatMap(
                  (c) => c.images?.map((img) => img.image) || []
                ) || []
              }
              images3d={
                product.color?.flatMap(
                  (c) =>
                    c.models3D?.map((m) => ({
                      previewImage: m.previewImage,
                    })) || []
                ) || []
              }
              selectedColorImages={
                selectedColorId
                  ? product.color
                    .find((c) => c.id === selectedColorId)
                    ?.images?.map((img) => img.image) || []
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

        {/* Khoảng cách */}
        <div className="h-8" />

        {/* Khung mô tả + chi tiết + liên quan */}
        <BottomSection
          related={related.map((item) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
            price: item.price,
            description: item.description,
            thumbnailImage: item.thumbnailImage || "/default-image.png",
          }))}
          product={{
            ...product!,
            images:
              product!.images?.map((img) => img.image) || ["/default-image.png"],
          }}
        />
      </div>
    </div>
  );
};

export default ProductDetail;
