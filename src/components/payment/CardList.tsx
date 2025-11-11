"use client"

import { Star, Trash2 } from "lucide-react"

interface CreditCard {
  id: number
  cardType: string
  lastFour: string
  holder: string
  expiry: string
  isDefault: boolean
  cardNetwork: string
}

interface CardListProps {
  cards: CreditCard[]
  onSetDefault: (cardId: number) => void
  onDeleteCard: (cardId: number) => void
}

export default function CardList({ cards, onSetDefault, onDeleteCard }: CardListProps) {
  const getCardGradient = (network: string) => {
    if (network === "mastercard") return "from-orange-500 to-red-500"
    return "from-blue-600 to-blue-800"
  }

  if (cards.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">Bạn chưa có thẻ nào. Hãy thêm thẻ đầu tiên của bạn.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`overflow-hidden transition-all hover:shadow-lg border rounded-lg ${
            card.isDefault ? "ring-2 ring-green-500" : "border-gray-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-4 p-4">
            {/* Card Visual */}
            <div
              className={`w-full sm:w-40 h-24 rounded-lg bg-gradient-to-br ${getCardGradient(card.cardNetwork)} p-4 text-white flex flex-col justify-between flex-shrink-0`}
            >
              <div className="text-xs opacity-80">CREDIT CARD</div>
              <div className="text-lg font-mono tracking-widest">•••• •••• •••• {card.lastFour}</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs opacity-80">Card Holder</div>
                  <div className="text-sm font-medium">{card.holder}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-80">Expires</div>
                  <div className="text-sm font-medium">{card.expiry}</div>
                </div>
              </div>
            </div>

            {/* Card Info */}
            <div className="flex-1 flex flex-col justify-between py-2">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Loại thẻ</p>
                  <p className="font-semibold text-gray-900">{card.cardType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Chủ thẻ</p>
                  <p className="font-semibold text-gray-900">{card.holder}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">4 số cuối</p>
                  <p className="font-semibold text-gray-900">{card.lastFour}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Hết hạn</p>
                  <p className="font-semibold text-gray-900">{card.expiry}</p>
                </div>
              </div>

              {card.isDefault && (
                <div className="inline-flex items-center gap-1 text-green-600 text-sm font-medium mb-3 w-fit">
                  <Star className="w-4 h-4 fill-green-600" />
                  Thẻ mặc định
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 justify-center sm:justify-end">
              {!card.isDefault && (
                <button
                  onClick={() => onSetDefault(card.id)}
                  className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium border border-green-200 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                >
                  <Star className="w-4 h-4 mr-1" />
                  Đặt mặc định
                </button>
              )}
              <button
                onClick={() => onDeleteCard(card.id)}
                className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Xóa
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}