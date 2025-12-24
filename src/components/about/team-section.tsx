"use client"
import { motion } from "framer-motion"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import manager1 from "@/assets/manager1.jpg"
import staff1 from "@/assets/staff1.jpg"
import staff2 from "@/assets/staff2.jpg"
import manager2 from "@/assets/nguyenvanan.jpg"
import manager3 from "@/assets/manager3.jpg"


export function TeamSection() {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  const team = [
    {
      name: "Nguyễn Văn An",
      role: "Giám đốc thiết kế",
      image: manager1,
    },
    {
      name: "Trần Thị Bình",
      role: "Trưởng phòng sản xuất",
      image: staff1,
    },
    {
      name: "Lê Minh Cường",
      role: "Chuyên gia tư vấn",
      image: staff2,
    },
    {
      name: "Phạm Thu Hương",
      role: "Trưởng phòng Marketing",
      image: manager2,
    },
    {
      name: "Hoàng Đức Minh",
      role: "Giám đốc Kinh doanh",
      image: manager3,
    },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % team.length)
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + team.length) % team.length)
  }

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div className="text-center mb-16" {...fadeInUp}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Đội ngũ của chúng tôi</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Những con người tài năng đứng sau thành công của FurniMart
          </p>
        </motion.div>

        <div className="relative">
          {/* Navigation buttons */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-emerald-50 border-2 border-emerald-200 text-emerald-600 hover:text-emerald-700 w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-emerald-50 border-2 border-emerald-200 text-emerald-600 hover:text-emerald-700 w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Carousel container */}
          <div className="overflow-hidden px-14">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / 3)}%)`,
              }}
            >
              {team.map((member, index) => (
                <div key={index} className="min-w-[100%] sm:min-w-[50%] lg:min-w-[33.333%] px-4">
                  <motion.div
                    className="text-center group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="relative mb-6 overflow-hidden rounded-2xl">
                      <img
                        src={member.image || "/placeholder.svg"}
                        alt={member.name}
                        className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                    <p className="text-emerald-600 font-medium">{member.role}</p>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {team.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentIndex ? "bg-emerald-600" : "bg-gray-300"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
