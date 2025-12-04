import { AlertCircle } from "lucide-react"

export function BlogCustomerAlert() {
  return (
    <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Quyền truy cập bị hạn chế</h3>
          <p className="text-yellow-700 text-sm leading-relaxed mb-3">
            Bạn đang đăng nhập với vai trò <span className="font-semibold">Khách hàng</span>. Chức năng tạo và quản lý
            blog chỉ dành cho <span className="font-semibold">Nhân viên</span> (Admin, Manager, Seller).
          </p>
          <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
            <p className="font-medium mb-1">💡 Gợi ý:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Nếu bạn là nhân viên, vui lòng đăng nhập bằng tài khoản nhân viên</li>
              <li>Khách hàng có thể xem blog tại trang Tin Tức & Blog</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
