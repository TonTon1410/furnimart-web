/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Truck, ShieldCheck, RotateCcw, MessageSquare } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { Link } from "react-router-dom";

import "swiper/css";
import "swiper/css/pagination";

import ProductCard from "@/components/ProductCard";
import { productService, type Product } from "@/service/homeService";
import axios from "axios";

// Import ảnh local đúng chuẩn
import heroImg from "@/assets/home-image.png";

// Sử dụng API Gateway chính (port 8080) để routing đến service categories
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://furnimart.click/api";

// Tạo axios instance cho public API (không cần token)
const publicAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ---- helpers & animation ----
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const t = e.currentTarget as HTMLImageElement;
  if ((t as any)._fb) return;
  (t as any)._fb = 1;
  t.src =
    "https://images.unsplash.com/photo-1616627981169-f97ab76673be?auto=format&fit=crop&w=1200&q=80";
};

// ---------------- Home ----------------
type Category = {
  id: number;
  categoryName: string;
  description?: string;
  image?: string;
  status: "ACTIVE" | "INACTIVE";
};

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  // ✅ Categories (load bằng axiosClient tại chỗ)
  const [cats, setCats] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsErr, setCatsErr] = useState<string | null>(null);

  useEffect(() => {
    productService
      .getAll()
      .then((res) => setProducts(res.data.data))
      .catch((err) => {
        console.error("Load products error:", err);
      });
  }, []);

  useEffect(() => {
    // Gọi API public không cần token - sử dụng publicAxios
    publicAxios
      .get<{ status: number; message: string; data: Category[] }>("/categories")
      .then((res) => {
        console.log("✅ Categories loaded:", res.data);
        const all = res.data?.data ?? [];
        const activeCats = all.filter((c: Category) => c.status === "ACTIVE");

        // Delay nhỏ để đảm bảo DOM ready trước khi render Swiper
        setTimeout(() => {
          setCats(activeCats);
          setCatsLoading(false);
        }, 50);
      })
      .catch((err: any) => {
        console.error("❌ Load categories error:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        // Nếu lỗi, vẫn set empty array để không hiển thị loading mãi
        setCats([]);
        setCatsErr(
          err?.response?.data?.message ||
            err?.message ||
            "Không tải được danh mục"
        );
        setCatsLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen relative pb-24 sm:pb-20">
      {/* HERO – 2 cột */}
      <section className="relative grid min-h-screen grid-cols-1 overflow-hidden bg-emerald-50 sm:grid-cols-2">
        {/* overlay để navbar dễ đọc */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/60 to-transparent" />

        {/* Cột trái: text */}
        <div className="relative flex flex-col justify-center px-4 sm:px-8 py-12 sm:py-20 sm:pl-16">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight text-gray-900 lg:text-6xl">
              Nội thất <span className="text-emerald-600">Hiện đại</span> & Tối
              giản
            </h1>
            <p className="mt-4 sm:mt-6 max-w-prose text-base sm:text-lg text-gray-600">
              Thiết kế tinh gọn, chất liệu bền bỉ, cảm hứng Bắc Âu. Nâng tầm
              không gian sống của bạn.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="rounded-xl bg-emerald-600 px-6 py-4 text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-95"
              >
                Mua ngay
              </Link>
              <a
                href="#collection"
                className="rounded-xl border border-emerald-200 bg-white px-6 py-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 active:scale-95"
              >
                Khám phá
              </a>
            </div>

            {/* Feature pills */}
            <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
              {[
                { icon: Truck, label: "Miễn phí vận chuyển" },
                { icon: ShieldCheck, label: "Thanh toán an toàn" },
                { icon: RotateCcw, label: "Dễ đổi trả" },
                { icon: MessageSquare, label: "Hỗ trợ 24/7" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-emerald-100 bg-white/90 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 shadow-sm"
                >
                  <Icon className="h-4 w-4 text-emerald-600" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Cột phải: ảnh */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative flex items-end justify-center"
        >
          <img
            src={heroImg}
            alt="Phòng khách hiện đại"
            className="w-full sm:w-[650px] max-w-full object-contain drop-shadow-2xl px-4 sm:px-0"
            onError={onImgError}
          />
        </motion.div>
      </section>

      {/* ✅ CATEGORIES – 1 hàng, tự chạy bằng Swiper */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
        <div>
          <div className="mb-4 sm:mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Danh mục
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Khám phá các nhóm sản phẩm nổi bật
              </p>
            </div>
            <Link
              to="/shop"
              className="text-sm font-semibold text-emerald-700 hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>

          {catsLoading ? (
            <Swiper
              modules={[Autoplay]}
              slidesPerView={1.2}
              spaceBetween={16}
              autoplay={{ delay: 2200, disableOnInteraction: false }}
              loop
              speed={650}
              breakpoints={{
                640: { slidesPerView: 2.2, spaceBetween: 18 },
                1024: { slidesPerView: 3.2, spaceBetween: 20 },
                1280: { slidesPerView: 4, spaceBetween: 22 },
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <SwiperSlide key={i}>
                  <div className="h-56 w-full animate-pulse rounded-3xl bg-gray-100" />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : catsErr ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {catsErr}
            </div>
          ) : cats.length === 0 ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 text-gray-600">
              Chưa có danh mục khả dụng.
            </div>
          ) : cats.length < 4 ? (
            // Hiển thị grid thông thường khi có ít categories
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cats.map((c) => (
                <div
                  key={c.id}
                  className="group relative overflow-hidden rounded-3xl opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
                >
                  <Link to={`/shop?catId=${c.id}`}>
                    <img
                      src={
                        c.image ||
                        "https://images.unsplash.com/photo-1616627981169-f97ab76673be?auto=format&fit=crop&w=1200&q=80"
                      }
                      alt={c.categoryName}
                      onError={onImgError}
                      className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="text-sm opacity-90">Khám phá</div>
                      <div className="text-xl font-bold">{c.categoryName}</div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            // Swiper khi có nhiều categories
            <Swiper
              key={`cat-swiper-${cats.length}`}
              modules={[Autoplay]}
              slidesPerView={1.2}
              spaceBetween={16}
              autoplay={{ delay: 2200, disableOnInteraction: false }}
              loop={true}
              speed={650}
              observer={true}
              observeParents={true}
              watchOverflow={true}
              breakpoints={{
                640: { slidesPerView: 2.2, spaceBetween: 18 },
                1024: { slidesPerView: 3.2, spaceBetween: 20 },
                1280: { slidesPerView: 4, spaceBetween: 22 },
              }}
            >
              {cats.map((c) => (
                <SwiperSlide key={c.id}>
                  <motion.div
                    variants={fadeUp}
                    className="group relative overflow-hidden rounded-3xl"
                  >
                    <Link to={`/shop?catId=${c.id}`}>
                      <img
                        src={
                          c.image ||
                          "https://images.unsplash.com/photo-1616627981169-f97ab76673be?auto=format&fit=crop&w=1200&q=80"
                        }
                        alt={c.categoryName}
                        onError={onImgError}
                        className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="text-sm opacity-90">Khám phá</div>
                        <div className="text-xl font-bold">
                          {c.categoryName}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* SẢN PHẨM NỔI BẬT */}
      <section id="collection" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Sản phẩm nổi bật
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Gợi ý cho không gian tối giản
              </p>
            </div>
            <Link
              to="/shop"
              className="text-sm font-semibold text-emerald-700 hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>

          <motion.div
            className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {products.map((p) => {
              const img =
                p.thumbnailImage || p.images?.[0]?.image || "/fallback.jpg";

              return (
                <motion.div key={p.id} variants={fadeUp}>
                  <ProductCard
                    className="group"
                    data={{
                      id: p.id,
                      slug: p.slug,
                      description: p.name,
                      price: p.price,
                      thumbnailImage: img,
                    }}
                    // Note: ProductCard không có onAdd prop
                    // Người dùng cần vào trang chi tiết để chọn màu trước khi thêm vào giỏ
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* KHÁCH HÀNG NÓI GÌ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Khách hàng nói gì
          </h3>

          <div className="mt-6">
            <Swiper
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              loop
              slidesPerView={1}
            >
              {[
                {
                  q: "Thiết kế tối giản nhưng chắc chắn. Giao hàng nhanh.",
                  n: "Minh T.",
                },
                {
                  q: "Sofa êm và mát. Dịch vụ chăm sóc khách hàng tuyệt vời.",
                  n: "Lan P.",
                },
                {
                  q: "Bàn trà gỗ sồi đẹp hơn mong đợi. Sẽ quay lại mua lần nữa.",
                  n: "Hải D.",
                },
              ].map((t, i) => (
                <SwiperSlide key={i}>
                  <blockquote className="mx-auto max-w-xl rounded-3xl border border-gray-100 bg-gray-50 px-6 py-8 text-gray-700 shadow">
                    “{t.q}”
                    <footer className="mt-4 text-sm font-semibold text-gray-900">
                      — {t.n}
                    </footer>
                  </blockquote>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
