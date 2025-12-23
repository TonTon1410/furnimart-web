"use client"
import { motion } from "framer-motion"
import { Truck, Shield, Clock } from "lucide-react"

export function ServicesSection() {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const services = [
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Giao hàng miễn phí",
      description: "Miễn phí giao hàng cho đơn hàng trên 5 triệu",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Bảo hành 2 năm",
      description: "Bảo hành toàn diện cho tất cả sản phẩm",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Hỗ trợ 24/7",
      description: "Đội ngũ tư vấn luôn sẵn sàng hỗ trợ",
    },
  ]

  return (
    <section className="py-20 bg-emerald-900">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div className="text-center mb-16" {...fadeInUp}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Dịch vụ của chúng tôi</h2>
          <p className="text-xl text-emerald-200 max-w-2xl mx-auto">
            Cam kết mang đến trải nghiệm tốt nhất cho khách hàng
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="bg-emerald-800 p-8 rounded-2xl text-center hover:bg-emerald-700 transition-colors duration-300"
              variants={fadeInUp}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 text-white rounded-full mb-6">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{service.title}</h3>
              <p className="text-emerald-200 leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
