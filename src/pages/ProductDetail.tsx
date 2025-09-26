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

  const getRelatedProducts = async (categoryId: number, productId: string): Promise<Product[]> => {
    if (!categoryId) return [];
    try {
      const res = await productService.getByCategory(categoryId);
      if (res?.data?.data && res.data.data.id !== productId) {
        return [res.data.data];
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
        console.log("Fetching product by slug:", slug);
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
      {/* Khoảng cách giữa header và ProductDetail */}
      <div className="h-32" />
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Hình ảnh */}
          <RightSection
            thumbnailImage={product.thumbnailImage || "/default-image.png"}
            images={
              product.color && product.color.length > 0
                ? product.color.flatMap((c) => c.images?.map((img) => img.image) || [])
                : []
            }
            images3d={
              product.color && product.color.length > 0
                ? product.color.flatMap(
                  (c) =>
                    c.models3D?.map((m) => ({ previewImage: m.previewImage })) || []
                )
                : []
            }
          />


          {/* Thông tin */}
          <LeftSection product={product} />
        </div>
        {/* Khoảng cách giữa Right/LeftSection và BottomSection */}
        <div className="h-10" />
        {/* Sản phẩm liên quan */}
        <BottomSection
          related={related.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            height: item.height,
            width: item.width,
            length: item.length,
            weight: item.weight,
            categoryName: item.categoryName,
            materialName: item.materialName,
            images: item.images?.map((img) => img.image) && item.images?.length > 0 ? item.images.map((img) => img.image) : ["/default-image.png"],
          }))}
          product={{
            ...product!,
            images: product!.images?.map((img) => img.image) && product!.images?.length > 0 ? product!.images.map((img) => img.image) : ["/default-image.png"],
          }}
        />
      </div>
    </div>
  );
};

export default ProductDetail;
