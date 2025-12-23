"use client"
import { motion } from "framer-motion"
import { Users, Award, Heart } from "lucide-react"

export function ValuesSection() {
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

  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Tình yêu với thiết kế",
      description: "Chúng tôi đam mê tạo ra những sản phẩm nội thất đẹp và chức năng",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Chất lượng cao",
      description: "Sử dụng nguyên liệu tốt nhất và quy trình sản xuất nghiêm ngặt",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Khách hàng là trung tâm",
      description: "Luôn lắng nghe và đáp ứng nhu cầu của từng khách hàng",
    },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div className="text-center mb-16" {...fadeInUp}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Giá trị cốt lõi</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Những giá trị định hướng mọi hoạt động của chúng tôi
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {values.map((value, index) => (
            <motion.div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300"
              variants={fadeInUp}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-6">
                {value.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
              <p className="text-gray-600 leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
