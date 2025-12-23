"use client"
import { motion } from "framer-motion"
import { Truck, ShieldCheck, Wrench, RotateCcw, Eye, Headphones, CheckCircle } from "lucide-react"
import { Link } from "react-router-dom"

// Animation variants
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.1 } } }

const services = [
  {
    icon: Truck,
    title: "Giao hàng miễn phí",
    description:
      "Miễn phí vận chuyển cho đơn hàng trên 5 triệu đồng trong khu vực TP.HCM. Giao hàng nhanh chóng và đúng hẹn.",
    color: "emerald",
  },
  {
    icon: Wrench,
    title: "Lắp đặt chuyên nghiệp",
    description:
      "Đội ngũ thợ lành nghề hỗ trợ lắp ráp và sắp xếp nội thất tại nhà bạn một cách nhanh chóng và chuyên nghiệp.",
    color: "blue",
  },
  {
    icon: Eye,
    title: "Trải nghiệm 3D",
    description: "Xem trước sản phẩm với công nghệ 3D hiện đại, giúp bạn hình dung rõ ràng trước khi mua hàng.",
    color: "purple",
  },
  {
    icon: ShieldCheck,
    title: "Bảo hành dài hạn",
    description: "Bảo hành lên đến 24 tháng cho tất cả sản phẩm. Hỗ trợ sửa chữa và thay thế linh kiện miễn phí.",
    color: "amber",
  },
  {
    icon: RotateCcw,
    title: "Đổi trả dễ dàng",
    description:
      "Chính sách đổi trả trong 30 ngày, không cần lý do. Hoàn tiền 100% nếu sản phẩm có lỗi từ nhà sản xuất.",
    color: "rose",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description:
      "Đội ngũ chăm sóc khách hàng luôn sẵn sàng giải đáp mọi thắc mắc qua điện thoại, email và chat trực tuyến.",
    color: "cyan",
  },
]

export default function ServicesPage() {
  return (
    <main className="min-h-screen relative pb-20">
      {/* HERO SECTION */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
        {/* Overlay for navbar readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
              Dịch vụ của <span className="text-emerald-600">chúng tôi</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Cam kết mang đến trải nghiệm mua sắm hoàn hảo với đầy đủ dịch vụ hỗ trợ từ A đến Z
            </p>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-yellow-200/30 rounded-full blur-3xl" />
      </section>

      {/* SERVICES GRID */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <motion.div
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {services.map((service, idx) => {
            const Icon = service.icon
            const colorClasses = {
              emerald: "bg-emerald-100 text-emerald-600",
              blue: "bg-blue-100 text-blue-600",
              purple: "bg-purple-100 text-purple-600",
              amber: "bg-amber-100 text-amber-600",
              rose: "bg-rose-100 text-rose-600",
              cyan: "bg-cyan-100 text-cyan-600",
            }

            return (
              <motion.div
                key={idx}
                variants={fadeUp}
                className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`inline-flex rounded-2xl p-4 ${colorClasses[service.color as keyof typeof colorClasses]}`}
                >
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">{service.title}</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">{service.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* COMPANY JOURNEY SECTION */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Cam kết của chúng tôi</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Mỗi dịch vụ được xây dựng dựa trên kinh nghiệm và sự tận tâm
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="order-2 lg:order-1"
            >
              <img
                src="/professional-delivery-team-loading-furniture-into-.jpg"
                alt="Đội ngũ giao hàng chuyên nghiệp"
                className="w-full rounded-3xl shadow-xl object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6 order-1 lg:order-2"
            >
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Vận chuyển & Lắp đặt tận nhà</h3>
              <p className="text-gray-600 leading-relaxed">
                Với đội ngũ hơn 100 nhân viên vận chuyển và lắp đặt được đào tạo bài bản, chúng tôi cam kết mang đến
                trải nghiệm giao hàng chuyên nghiệp nhất. Mọi sản phẩm được đóng gói cẩn thận và bảo vệ tối đa.
              </p>
              <ul className="space-y-3">
                {[
                  "Đội ngũ kỹ thuật viên lành nghề",
                  "Xe tải hiện đại, an toàn",
                  "Bảo hiểm toàn diện cho hàng hóa",
                  "Cam kết đúng giờ, đúng hẹn",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mt-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Công nghệ AR & Trải nghiệm 3D</h3>
              <p className="text-gray-600 leading-relaxed">
                Là đơn vị tiên phong ứng dụng công nghệ thực tế ảo tăng cường (AR) vào ngành nội thất tại Việt Nam.
                Khách hàng có thể xem trước sản phẩm trong không gian thực tế của mình trước khi quyết định mua.
              </p>
              <ul className="space-y-3">
                {[
                  "Xem sản phẩm 360 độ chi tiết",
                  "Đặt ảo sản phẩm vào không gian nhà bạn",
                  "So sánh nhiều phương án thiết kế",
                  "Tư vấn thiết kế online miễn phí",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <img
                src="/person-using-augmented-reality-ar-app-to-visualize.jpg"
                alt="Công nghệ AR 3D"
                className="w-full rounded-3xl shadow-xl object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-emerald-600 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Sẵn sàng khám phá?</h2>
            <p className="mt-4 text-lg text-emerald-50">Hãy để chúng tôi giúp bạn tạo nên không gian sống hoàn hảo</p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link
                to="/shop"
                className="rounded-xl bg-white px-8 py-4 text-sm font-semibold text-emerald-700 shadow-lg hover:bg-emerald-50 active:scale-95 transition-transform"
              >
                Xem sản phẩm
              </Link>
              <Link
                to="/contact"
                className="rounded-xl border-2 border-white px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                Liên hệ ngay
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
