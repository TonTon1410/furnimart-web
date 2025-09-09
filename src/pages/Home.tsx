import React from "react";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { Truck, ShieldCheck, RotateCcw, MessageSquare } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useCartStore } from "@/store/cart";

const products = [
  { id: "1", title: "Ghế gỗ Bắc Âu", price: 129, image: "/imgs/chair-1.jpg", badge: "Mới" },
  { id: "2", title: "Sofa tối giản 2 chỗ", price: 599, image: "/imgs/sofa-1.jpg" },
  { id: "3", title: "Bàn trà gỗ sồi", price: 189, image: "/imgs/table-1.jpg", badge: "Hot" },
  { id: "4", title: "Đèn đọc sách", price: 79, image: "/imgs/lamp-1.jpg" },
  { id: "5", title: "Kệ sách module", price: 259, image: "/imgs/shelf-1.jpg" },
  { id: "6", title: "Ghế bành êm ái", price: 219, image: "/imgs/chair-2.jpg" },
];

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

// Fallback ảnh ngẫu nhiên nếu file local thiếu
const onImgError = (e: React.SyntheticEvent<HTMLImageElement>, q: string) => {
  const t = e.currentTarget;
  // tránh lặp vô hạn
  if (t.dataset.fallback === "1") return;
  t.dataset.fallback = "1";
  t.src = `https://images.unsplash.com/photo-1616627981169-f97ab76673be?auto=format&fit=crop&w=1200&q=80`;
  // hoặc bạn có thể dùng query tùy nội dung:
  // t.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}`;
};

const Home: React.FC = () => {
  const add = useCartStore((s) => s.add);

  return (
    <main className="min-h-screen">
      {/* HERO – 2 cột */}
      <section className="relative overflow-hidden bg-emerald-50">
        {/* overlay để navbar transparent dễ đọc */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/30 to-transparent" />
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-200 blur-3xl opacity-50" />
        <div className="pointer-events-none absolute -right-24 -bottom-12 h-80 w-80 rounded-full bg-emerald-200 blur-3xl opacity-40" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 sm:grid-cols-2 sm:py-24">
          {/* text */}
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">
              Nội thất <span className="text-emerald-600">Hiện đại</span> & Tối giản
            </h1>
            <p className="mt-4 max-w-prose text-gray-600">
              Thiết kế tinh gọn, chất liệu bền bỉ, cảm hứng Bắc Âu. Nâng tầm không gian sống của bạn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/shop"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-95"
              >
                Mua ngay
              </a>
              <a
                href="#collection"
                className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 active:scale-95"
              >
                Khám phá
              </a>
            </div>

            {/* feature pills ngắn */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

          {/* hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-xl">
              <img
                src="/hero/hero-1.jpg"
                alt="Phòng khách hiện đại"
                onError={(e) => onImgError(e, "modern sofa")}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              {/* floating badge */}
              <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 shadow">
                Hàng mới về
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES – 3 banner */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: "Ghế", img: "/cat/chairs.jpg", href: "/shop?cat=chair", q: "chair" },
              { title: "Sofa", img: "/cat/sofas.jpg", href: "/shop?cat=sofa", q: "sofa" },
              { title: "Bàn", img: "/cat/tables.jpg", href: "/shop?cat=table", q: "table" },
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
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Sản phẩm nổi bật</h2>
              <p className="mt-1 text-sm text-gray-500">Gợi ý cho không gian tối giản</p>
            </div>
            <a href="/shop" className="text-sm font-semibold text-emerald-700 hover:underline">
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
                  data={p}
                  onAdd={(id) => {
                    const prod = products.find((x) => x.id === id)!;
                    add({ id: prod.id, title: prod.title, price: prod.price, image: prod.image }, 1);
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* LOGO THƯƠNG HIỆU */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-2 items-center gap-6 opacity-70 sm:grid-cols-6">
          {["b1","b2","b3","b4","b5","b6"].map((k) => (
            <img
              key={k}
              src={`/brands/${k}.svg`}
              alt={`Thương hiệu ${k.toUpperCase()}`}
              onError={(e) => {
                const t = e.currentTarget;
                if (t.dataset.fallback === "1") return;
                t.dataset.fallback = "1";
                t.src = "https://dummyimage.com/140x40/eeeeee/aaaaaa&text=Brand";
              }}
              className="mx-auto h-8 w-auto"
            />
          ))}
        </div>
      </section>

      {/* KHÁCH HÀNG NÓI GÌ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">Khách hàng nói gì</h3>

          <div className="mt-6">
            <Swiper
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              loop
              slidesPerView={1}
            >
              {[
                { q: "Thiết kế tối giản nhưng chắc chắn. Giao hàng nhanh.", n: "Minh T." },
                { q: "Sofa êm và mát. Dịch vụ chăm sóc khách hàng tuyệt vời.", n: "Lan P." },
                { q: "Bàn trà gỗ sồi đẹp hơn mong đợi. Sẽ quay lại mua lần nữa.", n: "Hải D." },
              ].map((t, i) => (
                <SwiperSlide key={i}>
                  <blockquote className="mx-auto max-w-xl rounded-3xl border border-gray-100 bg-gray-50 px-6 py-8 text-gray-700 shadow">
                    “{t.q}”
                    <footer className="mt-4 text-sm font-semibold text-gray-900">— {t.n}</footer>
                  </blockquote>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-emerald-600/95 px-6 py-12 text-center text-white shadow-lg">
          <h3 className="text-2xl font-bold sm:text-3xl">Giảm 10% cho đơn đầu tiên</h3>
          <p className="mt-2 text-white/90">Đăng ký nhận tin để không bỏ lỡ ưu đãi & bộ sưu tập mới.</p>
          <form className="mx-auto mt-6 flex max-w-md items-center gap-2">
            <input
              type="email"
              placeholder="nhap@email.com"
              className="h-12 w-full rounded-xl border-none bg-white/95 px-4 text-sm text-gray-900 outline-none ring-emerald-300 focus:ring-4"
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 active:scale-95"
            >
              Đăng ký
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Home;
