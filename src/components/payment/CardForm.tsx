"use client"

import type React from "react"
import { useState } from "react"
import { CreditCard, AlertCircle, Loader2 } from "lucide-react"

// Utility functions
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

function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, "")
  return cleaned.replace(/(.{4})/g, "$1 ").trim()
}

function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, "")
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
  }
  return cleaned
}

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

interface AddCardFormProps {
  onSubmit: (cardData: any) => void
  isLoading?: boolean
}

export default function AddCardForm({ onSubmit, isLoading = false }: AddCardFormProps) {
  const [formData, setFormData] = useState({
    holderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [detectedType, setDetectedType] = useState("UNKNOWN")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({ ...formData, cardNumber: value.replace(/\D/g, "") })

    const detected = detectCardType(value)
    setDetectedType(detected)

    if (errors.cardNumber && value.length >= 13) {
      setErrors({ ...errors, cardNumber: "" })
    }
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formatted = formatExpiry(value)
    setFormData({ ...formData, expiry: formatted })

    if (errors.expiry && formatted.length === 5) {
      setErrors({ ...errors, expiry: "" })
    }
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4)
    setFormData({ ...formData, cvv: value })

    if (errors.cvv && value.length >= 3) {
      setErrors({ ...errors, cvv: "" })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.holderName.trim()) {
      newErrors.holderName = "Tên chủ thẻ là bắt buộc"
    }

    if (!validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = "Số thẻ không hợp lệ"
    }

    if (!/^\d{2}\/\d{2}$/.test(formData.expiry)) {
      newErrors.expiry = "Định dạng: MM/YY"
    }

    if (formData.cvv.length < 3) {
      newErrors.cvv = "CVV phải có 3-4 chữ số"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: formData.cardNumber,
          expiry: formData.expiry,
          cvv: formData.cvv,
          holderName: formData.holderName,
          cardType: detectedType,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log("✅ [Frontend] Card added successfully:", data.card)
        
        // Pass the complete card data from API
        onSubmit(data.card)

        // Reset form
        setFormData({ holderName: "", cardNumber: "", expiry: "", cvv: "" })
        setDetectedType("UNKNOWN")
      } else {
        // Handle API error
        setErrors({ submit: data.error || "Không thể thêm thẻ. Vui lòng thử lại." })
      }
    } catch (error) {
      console.error("❌ [Frontend] Error adding card:", error)
      setErrors({ submit: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Preview */}
      <div className="relative h-40 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 text-white shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16" />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <p className="text-xs text-gray-300 uppercase tracking-wider">Số thẻ</p>
            <p className="text-lg font-mono tracking-wider mt-1">
              {formData.cardNumber ? formatCardNumber(formData.cardNumber).padEnd(19) : "XXXX XXXX XXXX XXXX"}
            </p>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-300 uppercase tracking-wider">Chủ thẻ</p>
              <p className="font-semibold">{formData.holderName || "TÊN CHỦ THẺ"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-300 uppercase tracking-wider">HSD</p>
              <p className="font-mono text-lg">{formData.expiry || "MM/YY"}</p>
            </div>
          </div>
        </div>

        {detectedType !== "UNKNOWN" && (
          <div className="absolute top-4 right-4 bg-white bg-opacity-20 px-3 py-1 rounded-full backdrop-blur-sm">
            <span className="text-xs font-bold text-white">{detectedType}</span>
          </div>
        )}
      </div>

      {/* Card Type Auto-detection */}
      {detectedType !== "UNKNOWN" && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CreditCard className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">
            Loại thẻ: <strong>{detectedType}</strong> (tự động phát hiện)
          </span>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor="holderName" className="block text-sm font-medium text-gray-700 mb-1">
            Tên chủ thẻ
          </label>
          <input
            id="holderName"
            type="text"
            placeholder="Nguyễn Văn A"
            value={formData.holderName}
            onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.holderName ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.holderName && <p className="text-red-600 text-sm mt-1">{errors.holderName}</p>}
        </div>

        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Số thẻ
          </label>
          <input
            id="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={formatCardNumber(formData.cardNumber)}
            onChange={handleCardNumberChange}
            maxLength={19}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.cardNumber ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.cardNumber && <p className="text-red-600 text-sm mt-1">{errors.cardNumber}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
              HSD (MM/YY)
            </label>
            <input
              id="expiry"
              type="text"
              placeholder="12/25"
              value={formData.expiry}
              onChange={handleExpiryChange}
              maxLength={5}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.expiry ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.expiry && <p className="text-red-600 text-sm mt-1">{errors.expiry}</p>}
          </div>

          <div>
            <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
              CVV
            </label>
            <input
              id="cvv"
              type="password"
              placeholder="123"
              value={formData.cvv}
              onChange={handleCvvChange}
              maxLength={4}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.cvv ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.cvv && <p className="text-red-600 text-sm mt-1">{errors.cvv}</p>}
          </div>
        </div>
      </div>

      {/* Submit Errors */}
      {errors.submit && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">{errors.submit}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          "Thêm thẻ"
        )}
      </button>
    </form>
  )
}