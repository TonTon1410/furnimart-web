"use client"
import { motion } from "framer-motion"

export function CtaSection() {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  return (
    <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div {...fadeInUp}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Sẵn sàng tạo nên không gian mơ ước?</h2>
          <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
            Hãy để chúng tôi giúp bạn biến ngôi nhà thành nơi hoàn hảo nhất
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-emerald-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-300">
              Xem sản phẩm
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-emerald-600 transition-colors duration-300">
              Liên hệ tư vấn
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
