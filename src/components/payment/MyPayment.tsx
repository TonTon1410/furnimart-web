"use client"

import { useEffect, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import axiosClient from "@/service/axiosClient"
import CreditCard from "./CreditCard"
import CardForm from "./CardForm"

interface SavedCard {
  id: string
  cardNumber: string
  cardType: string
  cardholderName: string
  expiryDate: string
}

export default function MyPayment() {
  const [cards, setCards] = useState<SavedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<"list" | "add">("list")

  const itemsPerPage = 3

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      setLoading(true)
      const response = await axiosClient.get("/payment/cards")
      setCards(response.data.data || response.data)
      console.log("[v0] Cards loaded:", response.data)
    } catch (error) {
      console.log("[v0] Error fetching cards:", error)
      alert("Không thể tải danh sách thẻ")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCard = async (newCard: any) => {
    try {
      const response = await axiosClient.post("/payment/cards", newCard)
      setCards([...cards, response.data.data || newCard])
      setCurrentPage(1)
      alert("Thẻ đã được thêm")
    } catch (error) {
      console.log("[v0] Error adding card:", error)
      alert("Không thể thêm thẻ")
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      await axiosClient.delete(`/payment/cards/${cardId}`)
      setCards(cards.filter((card) => card.id !== cardId))
      setSelectedCard(null)
      alert("Thẻ đã được xóa")
    } catch (error) {
      console.log("[v0] Error deleting card:", error)
      alert("Không thể xóa thẻ")
    }
  }

  const paginatedCards = cards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(cards.length / itemsPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Quản lý thanh toán</h1>
          <p className="mt-2 text-gray-600">Thêm và quản lý các phương thức thanh toán của bạn</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b">
            <div className="grid grid-cols-2">
              <button
                onClick={() => setActiveTab("list")}
                className={`py-3 px-4 text-center font-medium ${
                  activeTab === "list"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Danh sách thẻ
              </button>
              <button
                onClick={() => setActiveTab("add")}
                className={`py-3 px-4 text-center font-medium ${
                  activeTab === "add"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Thêm thẻ mới
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "list" && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : cards.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <p className="text-gray-500">Chưa có thẻ nào. Hãy thêm thẻ mới!</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedCards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => setSelectedCard(card)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedCard?.id === card.id
                              ? "border-blue-500 bg-blue-50"
                              : "hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{card.cardholderName}</p>
                              <p className="text-sm text-gray-500">
                                {card.cardType} ••••{card.cardNumber.slice(-4)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCard(card.id)
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedCard && (
                      <div className="border-2 border-blue-200 rounded-lg p-6 mt-4">
                        <h3 className="text-lg font-semibold mb-4">Chi tiết thẻ</h3>
                        <CreditCard
                          cardNumber={selectedCard.cardNumber}
                          cardholderName={selectedCard.cardholderName}
                          expiryDate={selectedCard.expiryDate}
                          cardType={selectedCard.cardType}
                        />
                      </div>
                    )}

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trước
                        </button>
                        <span className="px-4 text-sm text-gray-600">
                          Trang {currentPage} / {totalPages}
                        </span>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Tiếp
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "add" && (
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-4">Thêm thẻ tín dụng mới</h3>
                <CardForm onSubmit={handleAddCard} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}