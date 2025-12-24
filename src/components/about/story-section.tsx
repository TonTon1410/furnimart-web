"use client"
import { motion } from "framer-motion"
import noithat from "@/assets/noithat.jpg"

export function StorySection() {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Điểm nổi bật của chúng tôi</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Trải nghiệm 3D, AR sản phẩm: Khách hàng có thể xoay, phóng to và quan sát sản phẩm nội thất trong không
                gian 3D, giúp quyết định mua sắm chính xác hơn so với hình ảnh 2D truyền thống. Và kết hợp với ứng dụng
                AR cung cấp những trải nghiệm mua sắm độc đáo và tiện lợi.
              </p>
              <p>
                Quản lý tồn kho đa chi nhánh: Website cho phép kiểm tra sản phẩm còn hàng ở từng cửa hàng cụ thể, giúp
                khách hàng chọn địa điểm mua thuận tiện.
              </p>
              <p>Thanh toán trực tuyến an toàn: Tích hợp nhiều cổng thanh toán như Momo, ZaloPay, SEPAY và Stripe.</p>
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
            <img
              src={noithat}
              alt="Showroom FurniMart"
              className="rounded-2xl shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
