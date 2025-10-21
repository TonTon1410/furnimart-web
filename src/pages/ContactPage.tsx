
import ContactForm from "@/components/contact/contactForm"
import ContactInfo from "@/components/contact/ContactInfo"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <ContactForm />
          </div>

          {/* Info */}
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <ContactInfo />
          </div>
        </div>
      </div>
    </main>
  )
}
