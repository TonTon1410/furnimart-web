"use client"

import { useState } from "react"
import { X } from "lucide-react"
import AddCardForm from "./CardForm"

interface AddCardModalProps {
  open: boolean
  onClose: () => void
  onAdd: (cardData: any) => void
}

export default function AddCardModal({ open, onClose, onAdd }: AddCardModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleFormSubmit = (cardData: any) => {
    setIsLoading(true)
    setTimeout(() => {
      onAdd(cardData)
      setIsLoading(false)
      onClose()
    }, 300)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-start justify-between text-white">
          <div>
            <h2 className="text-xl font-bold">Thêm thẻ tín dụng</h2>
            <p className="text-sm text-green-50 mt-1">
              Nhập thông tin thẻ của bạn
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <AddCardForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}