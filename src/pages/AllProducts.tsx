// src/pages/AllProducts.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { productService, type Product } from "@/service/homeService";
import axiosClient from "@/service/axiosClient";
import { useSearchParams } from "react-router-dom";

import CustomDropdown from "@/components/CustomDropdown";

type Material = {
  id: number;
  image?: string;
  materialName: string;
  description?: string;
  status: string;
};

type Category = {
  id: number;
  categoryName: string;
  description?: string;
  image?: string;
  status: "ACTIVE" | "INACTIVE";
};

// Bổ sung khai báo cho Product để tránh lỗi TS khi truy cập materials
type ProductWithMaterials = Product & { materials?: Material[] };

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const AllProducts: React.FC = () => {
  // Các mức giá phù hợp cho nội thất
  const priceOptions = [
    { value: "0-5000000", label: "Dưới 5 triệu" },
    { value: "5000000-10000000", label: "5 - 10 triệu" },
    { value: "10000000-20000000", label: "10 - 20 triệu" },
    { value: "20000000-50000000", label: "20 - 50 triệu" },
    { value: "50000000-100000000", label: "50 - 100 triệu" },
    { value: "100000000-500000000", label: "Trên 100 triệu" },
  ];
  const [selectedPriceOption, setSelectedPriceOption] = useState<string>("");
  const [products, setProducts] = useState<ProductWithMaterials[]>([]);
  // Filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  // Lấy danh sách chất liệu từ products
  const materialOptions = Array.from(
    new Set(
      products
        .flatMap((p) => {
          const mats = Array.isArray((p as any).materials)
            ? ((p as any).materials as { materialName: string }[])
            : [];
          return [
            ...mats.map((m) => m.materialName),
            ...(p.materialName ? [p.materialName] : []),
          ];
        })
        .filter(Boolean)
    )
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCatId = searchParams.get("catId");
  const [selectedCat, setSelectedCat] = useState<number | null>(
    initialCatId ? Number(initialCatId) : null
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsErr, setCatsErr] = useState<string | null>(null);

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
        const res = await axiosClient.get<{ status: number; message: string; data: Product[] }>(
          `/products/category/${selectedCat}`
        );
        // API trả về { status, message, data: [...] }
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
    <main className="min-h-screen bg-linear-to-br from-gray-50 via-white to-emerald-50 pb-24 sm:pb-20">
      {/* Layout 2 cột: Sidebar trái (danh mục) + Lưới sản phẩm */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar danh mục + filter */}
          <aside className="col-span-12 md:col-span-3">
            <div className="sticky top-24 rounded-2xl border border-gray-100 shadow-lg bg-white p-6">
              <h3 className="mb-3 text-lg font-bold text-emerald-700 tracking-wide flex items-center gap-2">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zm0 7.5L4.21 7.13 12 3.5l7.79 3.63L12 9.5zm0 2.5l10-5v6c0 5.25-4.75 9.5-10 9.5S2 18.25 2 13V7l10 5z"
                    fill="#059669"
                  />
                </svg>
                Danh mục sản phẩm
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
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setSelectedCat(null)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition border ${
                        selectedCat === null
                          ? "bg-emerald-600 text-white border-emerald-600 shadow"
                          : "text-gray-700 border-transparent hover:bg-gray-50"
                      }`}
                    >
                      Tất cả
                    </button>
                  </li>
                  {categories.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setSelectedCat(c.id)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition border ${
                          selectedCat === c.id
                            ? "bg-emerald-600 text-white border-emerald-600 shadow"
                            : "text-gray-700 border-transparent hover:bg-gray-50"
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
            {/* Filter Bar - Horizontal */}
            <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search by name */}
                <div className="flex flex-col gap-1 w-full">
                  <label className="block text-sm font-medium text-gray-700">
                    Tìm kiếm
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Nhập tên sản phẩm..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm transition-all hover:border-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 text-gray-900"
                  />
                </div>

                {/* Filter by price */}
                <div>
                  <CustomDropdown
                    id="price-filter"
                    label="Mức giá"
                    value={selectedPriceOption}
                    onChange={(val) => {
                      setSelectedPriceOption(val);
                      if (val) {
                        const [min, max] = val.split("-").map(Number);
                        setPriceRange([min, max]);
                      } else {
                        setPriceRange([0, 10000000]);
                      }
                    }}
                    options={[{ value: "", label: "💰 Tất cả mức giá" }, ...priceOptions]}
                    placeholder="Chọn mức giá"
                    fullWidth
                  />
                </div>

                {/* Filter by material */}
                <div>
                  <CustomDropdown
                    id="material-filter"
                    label="Chất liệu"
                    value={selectedMaterial}
                    onChange={setSelectedMaterial}
                    options={[
                      { value: "", label: "🪵 Tất cả chất liệu" },
                      ...materialOptions.map((m) => ({ value: m, label: m })),
                    ]}
                    placeholder="Chọn chất liệu"
                    fullWidth
                  />
                </div>
              </div>
            </div>

            <motion.div
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
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
                products
                  .filter(
                    (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
                  )
                  .filter((p) => {
                    if (!selectedMaterial) return true;
                    // Kiểm tra trong materials
                    const mats = Array.isArray((p as any).materials)
                      ? ((p as any).materials as { materialName: string }[])
                      : [];
                    if (mats.some((m) => m.materialName === selectedMaterial))
                      return true;
                    // Kiểm tra trường materialName (nếu có)
                    return p.materialName === selectedMaterial;
                  })
                  .filter((p) => {
                    if (!searchTerm) return true;
                    return p.name.toLowerCase().includes(searchTerm.toLowerCase());
                  })
                  .map((p) => (
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
