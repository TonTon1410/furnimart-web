import { Sparkles } from "lucide-react"

export function BlogHeader() {
  return (
    <div className="relative overflow-hidden py-12 
      bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 text-white">
      
      {/* Hiệu ứng overlay */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-blue-300 drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
          <span className="text-blue-200 font-semibold tracking-wide uppercase text-xs">
            Không gian sáng tạo
          </span>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3 leading-tight drop-shadow-xl">
          Blog Của Tôi
        </h1>

        <p className="text-blue-100/90 max-w-2xl leading-relaxed">
          Quản lý và chia sẻ những câu chuyện, suy nghĩ và trải nghiệm của bạn với thế giới.
        </p>
      </div>
    </div>
  )
}
