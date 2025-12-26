import { type NextRequest, NextResponse } from "next/server"

// In-memory storage (replace with database in production)
let cardsStorage: any[] = []

// Utility function to detect card type from card number
function detectCardType(cardNumber: string): string {
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

// Luhn algorithm for card validation
function validateCardNumber(cardNumber: string): boolean {
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

// GET - Fetch all cards
export async function GET() {
  try {
    
    return NextResponse.json({
      success: true,
      cards: cardsStorage,
      total: cardsStorage.length,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách thẻ" },
      { status: 500 }
    )
  }
}

// POST - Add new card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardNumber, expiry, cvv, holderName, cardType: userCardType } = body

    // Validate required fields
    if (!cardNumber || !expiry || !cvv || !holderName) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      )
    }

    // Clean card number
    const cleanNumber = cardNumber.replace(/\D/g, "")

    // Validate card number length
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return NextResponse.json(
        { success: false, error: "Độ dài số thẻ không hợp lệ" },
        { status: 400 }
      )
    }

    // Validate card number using Luhn algorithm
    if (!validateCardNumber(cleanNumber)) {
      return NextResponse.json(
        { success: false, error: "Số thẻ không hợp lệ" },
        { status: 400 }
      )
    }

    // Validate expiry format (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return NextResponse.json(
        { success: false, error: "Định dạng ngày hết hạn không hợp lệ (MM/YY)" },
        { status: 400 }
      )
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(cvv)) {
      return NextResponse.json(
        { success: false, error: "CVV phải có 3-4 chữ số" },
        { status: 400 }
      )
    }

    // Auto-detect card type if not provided or mismatch
    const detectedType = detectCardType(cardNumber)
    const finalCardType = userCardType && userCardType !== "UNKNOWN" ? userCardType : detectedType

    // Get last 4 digits
    const lastFour = cleanNumber.slice(-4)

    // Create new card
    const newCard = {
      id: Date.now(),
      cardType: finalCardType,
      lastFour,
      holder: holderName,
      expiry,
      isDefault: cardsStorage.length === 0, // First card is default
      cardNetwork: finalCardType.toLowerCase(),
      createdAt: new Date().toISOString(),
    }

    // Add to storage
    cardsStorage.push(newCard)


    return NextResponse.json(
      {
        success: true,
        message: `Thẻ ${finalCardType} đã được thêm thành công`,
        card: newCard,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Không thể thêm thẻ. Vui lòng thử lại." },
      { status: 500 }
    )
  }
}

// DELETE - Remove a card
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get("id")

    if (!cardId) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID thẻ" },
        { status: 400 }
      )
    }

    const cardIdNum = parseInt(cardId)
    const cardIndex = cardsStorage.findIndex((card) => card.id === cardIdNum)

    if (cardIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy thẻ" },
        { status: 404 }
      )
    }

    // Remove card
    const deletedCard = cardsStorage.splice(cardIndex, 1)[0]


    // If deleted card was default, set first card as default
    if (deletedCard.isDefault && cardsStorage.length > 0) {
      cardsStorage[0].isDefault = true
    }

    return NextResponse.json(
      {
        success: true,
        message: "Đã xóa thẻ thành công",
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Không thể xóa thẻ. Vui lòng thử lại." },
      { status: 500 }
    )
  }
}

// PATCH - Set default card
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardId } = body

    if (!cardId) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID thẻ" },
        { status: 400 }
      )
    }

    const card = cardsStorage.find((c) => c.id === cardId)

    if (!card) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy thẻ" },
        { status: 404 }
      )
    }

    // Set all cards to not default
    cardsStorage.forEach((c) => (c.isDefault = false))

    // Set selected card as default
    card.isDefault = true


    return NextResponse.json(
      {
        success: true,
        message: "Đã đặt thẻ mặc định",
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Không thể đặt thẻ mặc định" },
      { status: 500 }
    )
  }
}