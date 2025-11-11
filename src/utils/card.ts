// Card detection and validation utilities
export function detectCardType(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, "")

  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleanNumber)) return "VISA"
  if (/^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7[01][0-9]|720)[0-9]{12}$/.test(cleanNumber))
    return "MASTERCARD"
  if (/^3[47][0-9]{13}$/.test(cleanNumber)) return "AMEX"
  if (/^6(?:011|5[0-9]{2})[0-9]{12}(?:[0-9]{3})?$/.test(cleanNumber)) return "DISCOVER"
  if (/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/.test(cleanNumber)) return "DINERS"
  if (/^(?:2131|1800|35\d{3})\d{11}$/.test(cleanNumber)) return "JCB"

  return "UNKNOWN"
}

// Format card number with spaces
export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, "")
  return cleaned.replace(/(.{4})/g, "$1 ").trim()
}

// Format expiry date MM/YY
export function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, "")
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
  }
  return cleaned
}

// Validate card number (Luhn algorithm)
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, "")
  let sum = 0
  let isEven = false

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(cleaned[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

// Get card logo color
export function getCardColor(cardType: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    VISA: { bg: "from-blue-600 to-blue-700", text: "text-white" },
    MASTERCARD: { bg: "from-orange-500 to-orange-600", text: "text-white" },
    AMEX: { bg: "from-teal-600 to-teal-700", text: "text-white" },
    DISCOVER: { bg: "from-yellow-600 to-yellow-700", text: "text-white" },
    DINERS: { bg: "from-purple-600 to-purple-700", text: "text-white" },
    JCB: { bg: "from-red-600 to-red-700", text: "text-white" },
    UNKNOWN: { bg: "from-gray-500 to-gray-600", text: "text-white" },
  }

  return colors[cardType] || colors.UNKNOWN
}
