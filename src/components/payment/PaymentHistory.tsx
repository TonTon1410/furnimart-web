"use client"

import { CheckCircle, Clock, AlertCircle } from "lucide-react"

interface Payment {
  id: string
  amount: string
  currency: string
  date: string
  status: string
  description: string
  cardLastFour: string
}

interface PaymentHistoryProps {
  payments: Payment[]
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  const getStatusIcon = (status: string) => {
    if (status === "Thành công") return <CheckCircle className="w-5 h-5 text-green-600" />
    if (status === "Đang xử lý") return <Clock className="w-5 h-5 text-yellow-600" />
    return <AlertCircle className="w-5 h-5 text-red-600" />
  }

  const getStatusColor = (status: string) => {
    if (status === "Thành công") return "bg-green-50 text-green-700"
    if (status === "Đang xử lý") return "bg-yellow-50 text-yellow-700"
    return "bg-red-50 text-red-700"
  }

  if (payments.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">Chưa có lịch sử thanh toán.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div 
          key={payment.id} 
          className="p-4 hover:shadow-md transition-shadow border border-gray-200 rounded-lg bg-white"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {getStatusIcon(payment.status)}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{payment.description}</p>
                <p className="text-sm text-gray-500">
                  {new Date(payment.date).toLocaleDateString("vi-VN")} • Thẻ ****{payment.cardLastFour}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {payment.amount}
                  <span className="text-sm ml-1">{payment.currency}</span>
                </p>
                <span
                  className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(payment.status)}`}
                >
                  {payment.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}