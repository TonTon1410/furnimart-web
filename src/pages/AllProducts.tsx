// src/pages/AllProducts.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { productService, type Product } from "@/service/homeService";
import axiosClient from "@/service/axiosClient";
import { useSearchParams } from "react-router-dom";

type Category = {
  id: number;
  categoryName: string;
  description?: string;
  image?: string;
  status: "ACTIVE" | "INACTIVE";
};

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const AllProducts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCatId = searchParams.get("catId");
  const [selectedCat, setSelectedCat] = useState<number | null>(
    initialCatId ? Number(initialCatId) : null
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsErr, setCatsErr] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedCat]);
  // ---- Load categories (ACTIVE) ----
  useEffect(() => {
    setCatsLoading(true);
    axiosClient
      .get<{ status: number; message: string; data: Category[] }>("/categories")
      .then((res) => {
        const all = res.data?.data ?? [];
        setCategories(all.filter((c) => c.status === "ACTIVE"));
      })
      .catch((e: any) => {
        setCatsErr(
          e?.response?.data?.message || e?.message || "Không tải được danh mục"
        );
      })
      .finally(() => setCatsLoading(false));
  }, []);
  useEffect(() => {
    const fromUrl = searchParams.get("catId");
    setSelectedCat(fromUrl ? Number(fromUrl) : null);
  }, [searchParams]);
  // ---- Load products: ALL (productService) | BY CATEGORY (category API) ----
  const fetchProducts = async () => {
    setLoading(true);
    setErr(null);
    try {
      if (selectedCat === null) {
        const res = await productService.getAll();
        setProducts(res.data.data);
      } else {
        const res = await axiosClient.get<{ data: Product[] }>(
          `/products/category/${selectedCat}`
        );
        // endpoint này trả mảng thẳng theo spec
        setProducts(res.data.data as unknown as Product[]);
      }
    } catch (e: any) {
      setErr(
        e?.response?.data?.message || e?.message || "Không tải được sản phẩm"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCat]);

  // Đồng bộ URL khi đổi danh mục
  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    if (selectedCat === null) sp.delete("catId");
    else sp.set("catId", String(selectedCat));
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCat]);

  return (
    <main className="min-h-screen bg-gray-50 pb-24 sm:pb-20">
      {/* Layout 2 cột: Sidebar trái (danh mục) + Lưới sản phẩm */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar danh mục */}
          <aside className="col-span-12 md:col-span-3">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-base font-semibold text-gray-900">
                Danh mục
              </h3>

              {/* Skeleton / lỗi / danh sách */}
              {catsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 w-full animate-pulse rounded-lg bg-gray-100"
                    />
                  ))}
                </div>
              ) : catsErr ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {catsErr}
                </div>
              ) : (
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => setSelectedCat(null)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        selectedCat === null
                          ? "bg-emerald-600 text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Tất cả
                    </button>
                  </li>
                  {categories.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setSelectedCat(c.id)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          selectedCat === c.id
                            ? "bg-emerald-600 text-white"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {c.categoryName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Lưới sản phẩm */}
          <div className="col-span-12 md:col-span-9">
            <motion.div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {loading && products.length === 0 ? (
                Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-white p-3">
                    <div className="h-44 w-full animate-pulse rounded-lg bg-gray-200" />
                    <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                    <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                  </div>
                ))
              ) : err ? (
                <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {err}
                </div>
              ) : products.length === 0 ? (
                <div className="col-span-full rounded-xl border bg-white p-6 text-gray-600">
                  Không có sản phẩm phù hợp.
                </div>
              ) : (
                products.map((p) => (
                  <motion.div key={p.id} variants={fadeUp}>
                    <ProductCard
                      className="group"
                      data={{
                        id: p.id,
                        slug: p.slug,
                        description: p.name,
                        price: p.price,
                        thumbnailImage:
                          p.thumbnailImage ||
                          p.images?.[0]?.image ||
                          "/fallback.jpg",
                      }}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AllProducts;
