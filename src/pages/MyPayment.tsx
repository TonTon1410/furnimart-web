"use client"

import { useState, useEffect } from "react"
import { CreditCard, Plus, Loader2, RefreshCw } from "lucide-react"
import { Pagination } from "@/components/payment/Pagination"

import CardList from "@/components/payment/CardList"
import PaymentHistory from "@/components/payment/PaymentHistory"
import AddCardModal from "@/components/payment/CardModal" 

const ITEMS_PER_PAGE = 3

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {message}
    </div>
  )
}

export default function MyPaymentPage() {
  const [cards, setCards] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"cards" | "history">("cards")
  const [cardPage, setCardPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Fetch cards from API
  const fetchCards = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      
      const response = await fetch('/api/cards')
      const data = await response.json()

      if (response.ok && data.success) {
        // If no cards in API, use mock data for demo
        if (!data.cards || data.cards.length === 0) {
          console.log("📝 Using mock data for cards")
          setCards([
            {
              id: 1,
              cardType: "VISA",
              lastFour: "1014",
              holder: "Nguyễn Văn A",
              expiry: "09/24",
              isDefault: false,
              cardNetwork: "visa",
            },
            {
              id: 2,
              cardType: "VISA",
              lastFour: "0006",
              holder: "Nguyễn Văn A & Trần Văn B",
              expiry: "12/22",
              isDefault: true,
              cardNetwork: "visa",
            },
            {
              id: 3,
              cardType: "MASTERCARD",
              lastFour: "0001",
              holder: "Nguyễn Thị C",
              expiry: "11/25",
              isDefault: false,
              cardNetwork: "mastercard",
            },
          ])
        } else {
          setCards(data.cards)
        }
      }
    } catch (error) {
      console.error("❌ Error fetching cards:", error)
      setToast({ message: "Không thể tải danh sách thẻ", type: "error" })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch payment history from API
  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/payments')
      const data = await response.json()

      if (response.ok && data.success) {
        // If no history in API, use mock data for demo
        if (!data.payments || data.payments.length === 0) {
          console.log("📝 Using mock data for history")
          setHistory([
            {
              id: "PAY001",
              amount: "1,250,000",
              currency: "VND",
              date: "2024-11-04",
              status: "Thành công",
              description: "Mua hàng - Đơn #12345",
              cardLastFour: "1014",
            },
            {
              id: "PAY002",
              amount: "2,800,000",
              currency: "VND",
              date: "2024-11-02",
              status: "Thành công",
              description: "Mua hàng - Đơn #12344",
              cardLastFour: "0006",
            },
            {
              id: "PAY003",
              amount: "890,000",
              currency: "VND",
              date: "2024-10-28",
              status: "Thành công",
              description: "Mua hàng - Đơn #12343",
              cardLastFour: "0001",
            },
          ])
        } else {
          setHistory(data.payments)
        }
      }
    } catch (error) {
      console.error("❌ Error fetching history:", error)
      setToast({ message: "Không thể tải lịch sử thanh toán", type: "error" })
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchCards()
    fetchHistory()
  }, [])

  // Set default card
  const handleSetDefault = async (cardId: number) => {
    try {
      const response = await fetch(`/api/cards/default`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update local state
        setCards(
          cards.map((card) => ({
            ...card,
            isDefault: card.id === cardId,
          }))
        )
        setToast({ message: "Đã đặt thẻ mặc định", type: "success" })
      } else {
        setToast({ message: data.error || "Không thể đặt thẻ mặc định", type: "error" })
      }
    } catch (error) {
      console.error("❌ Error setting default card:", error)
      // Fallback to local update if API fails
      setCards(
        cards.map((card) => ({
          ...card,
          isDefault: card.id === cardId,
        }))
      )
      setToast({ message: "Đã đặt thẻ mặc định (local)", type: "success" })
    }
  }

  // Delete card with API call
  const handleDeleteCard = async (cardId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thẻ này?")) return

    try {
      const response = await fetch(`/api/cards?id=${cardId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Remove from local state
        setCards(cards.filter((card) => card.id !== cardId))
        setToast({ message: "Đã xóa thẻ thành công", type: "success" })
      } else {
        setToast({ message: data.error || "Không thể xóa thẻ", type: "error" })
      }
    } catch (error) {
      console.error("❌ Error deleting card:", error)
      setToast({ message: "Không thể kết nối đến server", type: "error" })
    }
  }

  // Add card (called from modal)
  const handleAddCard = (cardData: any) => {
    console.log("✅ Card added:", cardData)
    
    // Add to local state
    setCards([...cards, cardData])
    setIsAddCardOpen(false)
    setToast({ message: "Thêm thẻ thành công", type: "success" })
    
    // Optionally refresh from API
    setTimeout(() => fetchCards(), 500)
  }

  // Pagination
  const cardsPaginated = cards.slice((cardPage - 1) * ITEMS_PER_PAGE, cardPage * ITEMS_PER_PAGE)
  const historyPaginated = history.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE)

  const totalCardPages = Math.ceil(cards.length / ITEMS_PER_PAGE)
  const totalHistoryPages = Math.ceil(history.length / ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toast notification */}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              Quản lý ví cá nhân
            </h1>
            <p className="text-gray-600 mt-2">Quản lý thẻ tín dụng và lịch sử thanh toán của bạn</p>
          </div>

          <button
            onClick={() => fetchCards(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab("cards")
              setCardPage(1)
            }}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === "cards" ? "text-green-600 border-b-2 border-green-600" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Thẻ của tôi ({cards.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("history")
              setHistoryPage(1)
            }}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === "history"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Lịch sử thanh toán ({history.length})
          </button>
        </div>

        {/* Cards Tab */}
        {activeTab === "cards" && (
          <div className="space-y-6">
            <button 
              onClick={() => setIsAddCardOpen(true)} 
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm thẻ mới
            </button>

            <CardList cards={cardsPaginated} onSetDefault={handleSetDefault} onDeleteCard={handleDeleteCard} />

            {totalCardPages > 1 && (
              <div className="flex justify-center pt-6">
                <Pagination currentPage={cardPage} totalPages={totalCardPages} onPageChange={setCardPage} />
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <PaymentHistory payments={historyPaginated} />

            {totalHistoryPages > 1 && (
              <div className="flex justify-center pt-6">
                <Pagination currentPage={historyPage} totalPages={totalHistoryPages} onPageChange={setHistoryPage} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Card Modal */}
      <AddCardModal open={isAddCardOpen} onClose={() => setIsAddCardOpen(false)} onAdd={handleAddCard} />
    </div>
  )
}