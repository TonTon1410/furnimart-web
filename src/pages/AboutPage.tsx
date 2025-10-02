"use client"
import { motion } from "framer-motion"
import { Users, Award, Heart, Truck, Shield, Clock } from "lucide-react"

const AboutPage = () => {
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

  const team = [
    {
      name: "Nguyễn Văn An",
      role: "Giám đốc thiết kế",
      image: "/professional-asian-designer.png",
    },
    {
      name: "Trần Thị Bình",
      role: "Trưởng phòng sản xuất",
      image: "/professional-asian-woman-manager.jpg",
    },
    {
      name: "Lê Minh Cường",
      role: "Chuyên gia tư vấn",
      image: "/professional-asian-man-consultant.jpg",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 pt-32 pb-20">
  <div className="max-w-7xl mx-auto px-6">
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="text-4xl md:text-6xl font-bold text-emerald-900 mb-6">
        Về chúng tôi
      </h1>
      <p className="text-xl text-emerald-700 max-w-3xl mx-auto leading-relaxed">
        FurniMart - Website thương mại điện tử nội thất đa chi nhánh mang đến cho khách hàng
        trải nghiệm mua sắm hiện đại, trực quan và tiện lợi.
      </p>
    </motion.div>
  </div>
</section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Điểm nổi bật của chúng tôi</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Trải nghiệm 3D, AR sản phẩm: Khách hàng có thể xoay, phóng to 
                  và quan sát sản phẩm nội thất trong không gian 3D, giúp quyết định 
                  mua sắm chính xác hơn so với hình ảnh 2D truyền thống. Và kết hợp với
                  ứng dụng Ả cung cấp những trải nghiệm mua sắm độc đáo và tiện lợi.
                </p>
                <p>
                  Quản lý tồn kho đa chi nhánh: Website cho phép kiểm tra sản phẩm 
                  còn hàng ở từng cửa hàng cụ thể, giúp khách hàng chọn địa điểm mua thuận tiện.
                </p>
                <p>
                  Thanh toán trực tuyến an toàn: Tích hợp nhiều cổng thanh toán như Momo, ZaloPay, SEPAY và Stripe.
                </p>
                <p>
                    Dịch vụ hậu mãi: Khách hàng có thể gửi yêu cầu đổi trả, bảo hành hoặc lắp ráp trực tiếp trên website.
                </p>
              </div>
            </motion.div>
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img src="src/assets/AR.png" alt="Showroom Furni" className="rounded-2xl shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
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

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Đội ngũ của chúng tôi</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Những con người tài năng đứng sau thành công của Furni
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {team.map((member, index) => (
              <motion.div key={index} className="text-center group" variants={fadeInUp}>
                <div className="relative mb-6 overflow-hidden rounded-2xl">
                  <img
                    src={member.image || "/AR.png"}
                    alt={member.name}
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-emerald-600 font-medium">{member.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
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

      {/* CTA Section */}
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

      
    </div>
  )
}

export default AboutPage
