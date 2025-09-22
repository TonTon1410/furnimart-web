// src/pages/AllProducts.tsx
import React, { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/cart";
import { productService, type Product } from "@/service/homeService";
import { CheckCircle } from "lucide-react";
import { authService } from "@/service/authService";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const AllProducts: React.FC = () => {
  const add = useCartStore((s) => s.add); // ✅ add(productId, qty)
  const [products, setProducts] = useState<Product[]>([]);
  const [addedProduct, setAddedProduct] = useState<string | null>(null);

  useEffect(() => {
    productService
      .getAll()
      .then((res) => setProducts(res.data.data))
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Tiêu đề */}
      <section className="bg-white py-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Tất cả sản phẩm</h1>
          <p className="mt-2 text-gray-500">Khám phá toàn bộ bộ sưu tập nội thất của chúng tôi</p>
        </div>
      </section>

      {/* Lưới sản phẩm */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {products.map((p) => {
            const img = p.thumbnailImage || p.images?.[0]?.image || "/fallback.jpg";
            return (
              <motion.div key={p.id} variants={fadeUp}>
                <ProductCard
                  className="group"
                  data={{
                    id: p.id,
                    // ProductCard linh hoạt: dùng name/title/description đều được
                    description: p.name,
                    price: p.price,
                    thumbnailImage: p.thumbnailImage || p.images?.[0]?.image || "/fallback.jpg",
                  }}
                  onAdd={async () => {
                    // 🔐 Chỉ thêm giỏ khi đã đăng nhập
                    if (!authService.isAuthenticated()) {
                      window.location.href = "/login";
                      return;
                    }
                    try {
                      await add(p.id, 1); // ✅ gọi API: /carts/add?productId=&quantity=
                      setAddedProduct(p.name);
                      setTimeout(() => setAddedProduct(null), 2000);
                    } catch (err) {
                      console.error("Add to cart error:", err);
                    }
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Toast xác nhận thêm giỏ hàng */}
      {addedProduct && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow-lg animate-slideUp">
          <CheckCircle className="h-5 w-5 text-white" />
          <span>
            Đã thêm <span className="font-semibold">{addedProduct}</span> vào giỏ hàng
          </span>
        </div>
      )}
    </main>
  );
};

export default AllProducts;
