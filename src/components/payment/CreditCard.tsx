interface CreditCardProps {
  cardNumber: string
  cardholderName: string
  expiryDate: string
  cardType: string
}

export default function CreditCard({ cardNumber, cardholderName, expiryDate, cardType }: CreditCardProps) {
  const isValidCardNumber = cardNumber.replace(/\s/g, "").length === 16
  const displayCardNumber = cardNumber
    .replace(/\s/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim()

  const getCardColor = () => {
    switch (cardType?.toLowerCase()) {
      case "visa":
        return "from-blue-600 to-blue-800"
      case "mastercard":
        return "from-red-600 to-red-800"
      case "amex":
        return "from-green-600 to-green-800"
      default:
        return "from-gray-600 to-gray-800"
    }
  }

  if (!isValidCardNumber) {
    return null
  }

  return (
    <div
      className={`w-full max-w-sm h-56 rounded-xl bg-gradient-to-br ${getCardColor()} text-white p-6 shadow-lg flex flex-col justify-between`}
    >
      <div className="flex justify-between items-start">
        <span className="text-xl font-bold">{cardType?.toUpperCase() || "CARD"}</span>
        <div className="text-2xl font-bold opacity-20">●●</div>
      </div>

      <div className="space-y-2">
        <p className="text-sm opacity-75">Card Number</p>
        <p className="text-2xl font-mono tracking-widest">{displayCardNumber || "•••• •••• •••• ••••"}</p>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs opacity-75">Card Holder</p>
          <p className="text-sm font-semibold uppercase">{cardholderName || "Name"}</p>
        </div>
        <div>
          <p className="text-xs opacity-75">Expires</p>
          <p className="text-sm font-mono">{expiryDate || "MM/YY"}</p>
        </div>
      </div>
    </div>
  )
}
