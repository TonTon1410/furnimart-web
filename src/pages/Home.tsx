import React, { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { Truck, ShieldCheck, RotateCcw, MessageSquare, CheckCircle } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useCartStore } from "@/store/cart";
import { productService, type Product } from "@/service/homeService";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

// Fallback ảnh ngẫu nhiên nếu file local thiếu
const onImgError = (e: React.SyntheticEvent<HTMLImageElement>, q: string) => {
  const t = e.currentTarget;
  if (t.dataset.fallback === "1") return;
  t.dataset.fallback = "1";
  t.src = `https://images.unsplash.com/photo-1616627981169-f97ab76673be?auto=format&fit=crop&w=1200&q=80`;
};

const Home: React.FC = () => {
  const add = useCartStore((s) => s.add);

  const [products, setProducts] = useState<Product[]>([]);
  const [addedProduct, setAddedProduct] = useState<string | null>(null); // ✅ thêm state toast

  useEffect(() => {
    productService
      .getAll()
      .then((res) => {
        setProducts(res.data.data);
      })
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen relative">
      {/* HERO – 2 cột */}
      <section className="relative grid min-h-screen grid-cols-1 overflow-hidden bg-emerald-50 sm:grid-cols-2">
        {/* overlay để navbar dễ đọc */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />

        {/* Cột bên trái: text */}
        <div className="relative flex flex-col justify-center px-8 py-20 sm:pl-16">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-extrabold leading-tight text-gray-900 sm:text-6xl">
              Nội thất <span className="text-emerald-600">Hiện đại</span> & Tối
              giản
            </h1>
            <p className="mt-6 max-w-prose text-lg text-gray-600">
              Thiết kế tinh gọn, chất liệu bền bỉ, cảm hứng Bắc Âu. Nâng tầm
              không gian sống của bạn.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/shop"
                className="rounded-xl bg-emerald-600 px-6 py-4 text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-95"
              >
                Mua ngay
              </a>
              <a
                href="#collection"
                className="rounded-xl border border-emerald-200 bg-white px-6 py-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 active:scale-95"
              >
                Khám phá
              </a>
            </div>

            {/* feature pills ngắn */}
            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Truck, label: "Miễn phí vận chuyển" },
                { icon: ShieldCheck, label: "Thanh toán an toàn" },
                { icon: RotateCcw, label: "Dễ đổi trả" },
                { icon: MessageSquare, label: "Hỗ trợ 24/7" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white/90 px-3 py-2 text-sm text-gray-700 shadow-sm"
                >
                  <Icon className="h-4 w-4 text-emerald-600" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Cột bên phải: ảnh sofa lớn */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative flex items-end justify-center"
        >
          <img
            src="src/assets/home-image.png"
            alt="Phòng khách hiện đại"
            onError={(e) => onImgError(e, "modern sofa")}
            className="w-[650px] max-w-full object-contain drop-shadow-2xl"
          />
        </motion.div>
      </section>

      {/* CATEGORIES – 3 banner */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Ghế",
                img: "/cat/chairs.jpg",
                href: "/shop?cat=chair",
                q: "chair",
              },
              {
                title: "Sofa",
                img: "/cat/sofas.jpg",
                href: "/shop?cat=sofa",
                q: "sofa",
              },
              {
                title: "Bàn",
                img: "/cat/tables.jpg",
                href: "/shop?cat=table",
                q: "table",
              },
            ].map((c) => (
              <motion.a
                key={c.title}
                href={c.href}
                variants={fadeUp}
                className="group relative overflow-hidden rounded-3xl"
              >
                <img
                  src={c.img}
                  alt={c.title}
                  onError={(e) => onImgError(e, c.q)}
                  className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-sm opacity-90">Khám phá</div>
                  <div className="text-xl font-bold">{c.title}</div>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
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
            <a
              href="/shop"
              className="text-sm font-semibold text-emerald-700 hover:underline"
            >
              Xem tất cả →
            </a>
          </div>

          <motion.div
            className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            {products.map((p) => (
              <motion.div key={p.id} variants={fadeUp}>
                <ProductCard
                  className="group"
                  data={{
                    id: p.id,
                    title: p.name,
                    price: p.price,
                    image:
                      p.thumbnailImage ||
                      p.images?.[0]?.image ||
                      "/fallback.jpg",
                  }}
                  onAdd={() => {
                    add(
                      {
                        id: p.id,
                        title: p.name,
                        price: p.price,
                        image:
                          p.thumbnailImage ||
                          p.images?.[0]?.image ||
                          "/fallback.jpg",
                      },
                      1
                    );
                    setAddedProduct(p.name);
                    setTimeout(() => setAddedProduct(null), 2000);
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ✅ TOAST xác nhận */}
      {addedProduct && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow-lg animate-slideUp">
          <CheckCircle className="h-5 w-5 text-white" />
          <span>Đã thêm <span className="font-semibold">{addedProduct}</span> vào giỏ hàng</span>
        </div>
      )}

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
