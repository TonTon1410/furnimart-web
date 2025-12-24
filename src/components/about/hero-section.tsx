"use client"
import { motion } from "framer-motion"

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-emerald-900 mb-6">Về chúng tôi</h1>
          <p className="text-xl text-emerald-700 max-w-3xl mx-auto leading-relaxed">
            FurniMart - Website thương mại điện tử nội thất đa chi nhánh mang đến cho khách hàng trải nghiệm mua sắm
            hiện đại, trực quan và tiện lợi.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
