
import ContactForm from "@/components/contact/contactForm"
import ContactInfo from "@/components/contact/ContactInfo"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form */}
          <div className="bg-white p-10 rounded-lg shadow-md">
            <ContactForm />
          </div>

          {/* Info */}
          <div className="bg-white p-10 rounded-lg shadow-md">
            <ContactInfo />
          </div>
        </div>
      </div>
    </main>
  )
}
