import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RightSection from "../components/productDetail/RightSection";
import LeftSection from "../components/productDetail/LeftSection";
import BottomSection from "../components/productDetail/BottomSection";
import { productService } from "../service/productService";
import type { Product as ProductType } from "../service/productService";

// Định nghĩa type Product cho đúng với các component
type Product = ProductType;

const ProductDetail: React.FC = () => {
  const { id: productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);

  // Hàm giả lập lấy sản phẩm liên quan
  const getRelatedProducts = async (): Promise<Product[]> => {
    // TODO: Thay thế bằng API thực tế nếu có
    // Hiện tại chỉ trả về mảng rỗng
    return [];
  };

  useEffect(() => {
    if (!productId) return;
    const fetchData = async () => {
      const res = await productService.getById(productId);
      if (res?.data?.data) {
        setProduct(res.data.data);
        if (res.data.data.categoryName) {
          const relatedRes = await getRelatedProducts();
          setRelated(relatedRes);
        }
      }
    };
    fetchData();
  }, [productId]);

  if (!productId) return <p>Product not found</p>;
  if (!product) return <p>Loading...</p>;

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
          images: item.images.map((img) => img.image),
        }))}
      />
    </div>
  );
};

export default ProductDetail;
