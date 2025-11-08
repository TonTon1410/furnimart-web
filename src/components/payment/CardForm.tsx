"use client"

import type React from "react"
import { useState } from "react"

interface CardFormProps {
  onSubmit: (data: {
    cardNumber: string
    expiryDate: string
    cvv: string
    cardholderName: string
    cardType: string
  }) => Promise<void>
  isLoading?: boolean
}

export default function CardForm({ onSubmit, isLoading = false }: CardFormProps) {
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    cardType: "visa",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let formatted = value

    if (name === "cardNumber") {
      formatted = value.replace(/\D/g, "").slice(0, 16)
    } else if (name === "expiryDate") {
      formatted = value.replace(/\D/g, "").slice(0, 4)
      if (formatted.length >= 2) {
        formatted = formatted.slice(0, 2) + "/" + formatted.slice(2)
      }
    } else if (name === "cvv") {
      formatted = value.replace(/\D/g, "").slice(0, 3)
    }

    setFormData((prev) => ({ ...prev, [name]: formatted }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.cardNumber ||
      formData.cardNumber.length !== 16 ||
      !formData.expiryDate ||
      formData.expiryDate.length !== 5 ||
      !formData.cvv ||
      formData.cvv.length !== 3 ||
      !formData.cardholderName.trim()
    ) {
      alert("Vui lòng điền đầy đủ thông tin thẻ")
      return
    }

    await onSubmit(formData)
    setFormData({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
      cardType: "visa",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div>
        <label className="text-sm font-medium">Loại thẻ</label>
        <select
          value={formData.cardType}
          onChange={(e) => setFormData((prev) => ({ ...prev, cardType: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="visa">Visa</option>
          <option value="mastercard">Mastercard</option>
          <option value="amex">American Express</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Số thẻ</label>
        <input
          type="text"
          name="cardNumber"
          placeholder="1234 5678 9012 3456"
          value={formData.cardNumber.replace(/(\d{4})/g, "$1 ").trim()}
          onChange={handleInputChange}
          maxLength={19}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Hết hạn (MM/YY)</label>
          <input
            type="text"
            name="expiryDate"
            placeholder="MM/YY"
            value={formData.expiryDate}
            onChange={handleInputChange}
            maxLength={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium">CVV</label>
          <input
            type="text"
            name="cvv"
            placeholder="123"
            value={formData.cvv}
            onChange={handleInputChange}
            maxLength={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Tên chủ thẻ</label>
        <input
          type="text"
          name="cardholderName"
          placeholder="John Doe"
          value={formData.cardholderName}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              cardholderName: e.target.value,
            }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Đang lưu..." : "Lưu thẻ"}
      </button>
    </form>
  )
}