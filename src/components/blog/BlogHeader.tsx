import { Sparkles } from "lucide-react"

export function BlogHeader() {
  return (
    <div className="bg-primary text-primary-foreground py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary/30 opacity-90"></div>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="h-6 w-6 text-accent" />
          <span className="text-accent font-semibold tracking-wide uppercase text-xs">Không gian sáng tạo</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3 text-balance leading-tight">Blog Của Tôi</h1>
        <p className="text-base text-primary-foreground/90 max-w-2xl text-pretty leading-relaxed">
          Quản lý và chia sẻ những câu chuyện, suy nghĩ và trải nghiệm của bạn với thế giới
        </p>
      </div>
    </div>
  )
}
