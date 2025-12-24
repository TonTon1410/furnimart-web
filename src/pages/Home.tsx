/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  ShieldCheck,
  Box,
  MousePointer2,
  Eye,
  Maximize2,
} from "lucide-react";
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
    <main className="min-h-screen relative">
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
            {/* 3D Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
            >
              <Box className="h-5 w-5" />
              <span className="text-sm font-semibold">
                Xem thử 3D ngay trên web
              </span>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight text-gray-900 lg:text-6xl">
              Trải nghiệm nội thất <span className="text-emerald-600">3D</span>{" "}
              trước khi mua
            </h1>
            <p className="mt-4 sm:mt-6 max-w-prose text-base sm:text-lg text-gray-600">
              Xoay, phóng to, xem chi tiết từng góc độ với công nghệ 3D tiên
              tiến. Tự tin lựa chọn nội thất phù hợp cho không gian sống của
              bạn.
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
            <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { icon: Box, label: "Xem 3D chi tiết", highlight: true },
                {
                  icon: MousePointer2,
                  label: "Tương tác 360°",
                  highlight: true,
                },
                { icon: ShieldCheck, label: "Thanh toán an toàn" },
                { icon: Truck, label: "Miễn phí vận chuyển" },
              ].map(({ icon: Icon, label, highlight }) => (
                <div
                  key={label}
                  className={`flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm transition-all hover:scale-105 ${
                    highlight
                      ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold"
                      : "border border-emerald-100 bg-white/90 text-gray-700"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      highlight ? "text-emerald-600" : "text-emerald-600"
                    }`}
                  />
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

      {/* 3D SHOWCASE SECTION */}
      <section className="relative overflow-hidden bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-600 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm mb-6">
              <Box className="h-5 w-5 text-white" />
              <span className="text-sm font-semibold text-white">
                Công nghệ 3D
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Trải nghiệm nội thất như thật
            </h2>
            <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto mb-12">
              Xoay, phóng to, khám phá từng chi tiết với mô hình 3D tương tác.
              Đặt thử nội thất vào không gian của bạn trước khi quyết định mua.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: Eye,
                  title: "Xem từ mọi góc độ",
                  desc: "Xoay 360° để khám phá sản phẩm từ mọi hướng nhìn",
                },
                {
                  icon: Maximize2,
                  title: "Phóng to chi tiết",
                  desc: "Zoom để xem rõ chất liệu, đường nét thiết kế",
                },
                {
                  icon: MousePointer2,
                  title: "Tương tác dễ dàng",
                  desc: "Điều khiển mượt mà bằng chuột hoặc cảm ứng",
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
                >
                  <feature.icon className="h-10 w-10 text-white mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/80">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 mt-12 px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              <Box className="h-5 w-5" />
              Khám phá mô hình 3D ngay
            </Link>
          </motion.div>
        </div>
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
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl flex items-center gap-3">
                Sản phẩm nổi bật
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold">
                  <Box className="h-4 w-4" />
                  3D
                </span>
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Xem mô hình 3D chi tiết cho mỗi sản phẩm
              </p>
            </div>
            <Link
              to="/shop"
              className="text-sm font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              Xem tất cả <Box className="h-4 w-4" />
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
                  <div className="relative">
                    {/* 3D Badge on product card */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-lg bg-linear-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold shadow-lg">
                      <Box className="h-3 w-3" />
                      3D
                    </div>
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
                  </div>
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
                  q: "Xem mô hình 3D giúp tôi tự tin hơn khi chọn sofa. Sản phẩm thực tế đúng như mong đợi!",
                  n: "Minh T.",
                },
                {
                  q: "Công nghệ 3D rất tiện lợi, xoay xem từng góc cạnh trước khi mua. Không lo mua nhầm nữa.",
                  n: "Lan P.",
                },
                {
                  q: "Lần đầu mua nội thất online nhưng nhờ có 3D nên rất yên tâm. Bàn trà đẹp hơn tưởng tượng!",
                  n: "Hải D.",
                },
                {
                  q: "Tính năng xem 3D chi tiết quá, zoom vào thấy cả vân gỗ. Chất lượng sản phẩm xuất sắc.",
                  n: "Thu N.",
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

      {/* CTA SECTION - 3D */}
      <section className="relative bg-linear-to-r from-gray-900 to-gray-800 pt-16 sm:pt-20 pb-0 overflow-hidden mb-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center pb-16 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
              <Box className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">
                Trải nghiệm 3D miễn phí
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Sẵn sàng khám phá nội thất của bạn?
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Hàng trăm mô hình 3D chất lượng cao đang chờ bạn. Xem thử, tương
              tác và tìm món đồ hoàn hảo cho không gian sống.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                <Box className="h-5 w-5" />
                Xem mô hình 3D ngay
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border-2 border-white/20 hover:bg-white/20 transition-all"
              >
                Tìm hiểu thêm
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default Home;