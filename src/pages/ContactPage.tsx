import ChatBox from "@/components/chat/ChatBox"

// Placeholder components cho phần Contact Form và Info nếu chưa có
// Bạn có thể thay thế bằng import thực tế từ file bạn đã có
const ContactForm = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-800">Gửi thắc mắc</h3>
    <input type="text" placeholder="Họ tên" className="w-full p-2 border rounded" />
    <input type="email" placeholder="Email" className="w-full p-2 border rounded" />
    <textarea placeholder="Nội dung" className="w-full p-2 border rounded h-32"></textarea>
    <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">Gửi ngay</button>
  </div>
)

const ContactInfo = () => (
  <div className="space-y-4 text-gray-600">
    <h3 className="text-lg font-semibold text-gray-800">Thông tin liên hệ</h3>
    <p>📍 123 Đường ABC, Quận 1, TP.HCM</p>
    <p>📞 0123 456 789</p>
    <p>✉️ support@example.com</p>
  </div>
)

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Liên Hệ Với Chúng Tôi</h1>
          <p className="mt-2 text-gray-600">Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
        </div>

        {/* Chat System - Nổi bật nhất */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Chat trực tuyến
          </h2>
          <ChatBox />
        </div>

        {/* Traditional Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <ContactForm />
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm flex flex-col justify-center">
            <ContactInfo />
          </div>
        </div>
      </div>
    </main>
  )
}
