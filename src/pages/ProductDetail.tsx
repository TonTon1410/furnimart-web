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

  const getRelatedProducts = async (categoryName: string, productId: string): Promise<Product[]> => {
    if (!categoryName) return [];
    try {
      const res = await productService.getByCategory(categoryName);
      if (res?.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.filter((item: Product) => item.id !== productId);
      }
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
        console.log("Fetching product by slug:", slug); // Debug
        const res = await productService.getBySlug(slug);
        if (res?.data?.data) {
          setProduct(res.data.data);
          if (res.data.data.categoryName) {
            const relatedRes = await getRelatedProducts(
              res.data.data.categoryName,
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
    <div className="bg-white min-h-screen p-6 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Hình ảnh */}
        <RightSection
          thumbnailImage={product.images[0]?.image || ""}
          images={product.images.map((img) => img.image)}
          images3d={product.images3d}
        />

        {/* Thông tin */}
        <LeftSection product={product} />
      </div>

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
          images: item.images.map((img) => img.image),
        }))}
        product={{
          ...product!,
          images: product!.images.map((img) => img.image),
        }}
      />
    </div>
  );
};

export default ProductDetail;
