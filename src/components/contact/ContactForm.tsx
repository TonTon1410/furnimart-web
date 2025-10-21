"use client"

import type React from "react"

import { useState } from "react"


interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
}

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Thay thế bằng API endpoint thực tế của bạn
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({ firstName: "", lastName: "", email: "", phone: "", message: "" })
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">FIRST NAME</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LAST NAME</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">EMAIL</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PHONE</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">WHAT DO YOU HAVE IN MIND</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Please enter query..."
          required
          className="w-full min-h-[150px]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#095544] hover:bg-[#073d33] text-white font-semibold py-2"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>

      {success && (
        <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">
          ✓ Cảm ơn bạn! Chúng tôi sẽ liên hệ với bạn sớm.
        </div>
      )}
    </form>
  )
}
