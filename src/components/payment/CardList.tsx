"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

interface SavedCard {
  id: string
  cardNumber: string
  cardType: string
  cardholderName: string
  expiryDate: string
}

interface CardListProps {
  cards: SavedCard[]
  onDelete: (id: string) => Promise<void>
  isLoading?: boolean
}

const ITEMS_PER_PAGE = 3

export default function CardList({ cards, onDelete, isLoading = false }: CardListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalPages = Math.ceil(cards.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedCards = cards.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  const handleDelete = async (id: string) => {
    if (confirm("Bạn chắc chắn muốn xóa thẻ này?")) {
      setDeletingId(id)
      try {
        await onDelete(id)
      } finally {
        setDeletingId(null)
      }
    }
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chưa có thẻ nào được lưu</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {paginatedCards.map((card) => (
          <div 
            key={card.id} 
            className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Loại thẻ</p>
                  <p className="font-semibold">{card.cardType?.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Số thẻ</p>
                  <p className="font-mono">•••• •••• •••• {card.cardNumber.slice(-4)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Chủ thẻ</p>
                  <p className="font-semibold">{card.cardholderName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hết hạn</p>
                  <p className="font-mono">{card.expiryDate}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(card.id)}
              disabled={isLoading || deletingId === card.id}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deletingId === card.id ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="text-sm font-medium">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}