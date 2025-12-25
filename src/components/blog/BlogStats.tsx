import { Calendar, Eye, EyeOff } from "lucide-react"

interface BlogStatsProps {
  total: number
  published: number
  hidden: number
}

export function BlogStats({ total, published, hidden }: BlogStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Tổng số blog</p>
            <p className="font-serif text-3xl font-bold text-foreground">{total}</p>
          </div>
          <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5 text-accent" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Đang hiển thị</p>
            <p className="font-serif text-3xl font-bold text-foreground ">{published}</p>
          </div>
          <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Eye className="h-5 w-5 text-accent" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Đã ẩn</p>
            <p className="font-serif text-3xl font-bold text-muted-foreground">{hidden}</p>
          </div>
          <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
            <EyeOff className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}
