import React from "react";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";

const ContactInfo = React.memo(() => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact us</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Nếu bạn có bất kỳ câu hỏi nào về sản phẩm hoặc dịch vụ của chúng tôi,
          vui lòng liên hệ với chúng tôi. Chúng tôi sẽ sẵn sàng giúp đỡ.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-[#095544] mt-1 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">Điện thoại</p>
            <p className="text-gray-600">+1 (555) 123-4567</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-[#095544] mt-1 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">Email</p>
            <p className="text-gray-600">hello@furni.com</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-[#095544] mt-1 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">Địa chỉ</p>
            <p className="text-gray-600">123 Main St, New York, NY 10001</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900 mb-3">
          Theo dõi chúng tôi
        </p>
        <div className="flex gap-3">
          <a
            href="#"
            className="p-2 bg-gray-100 hover:bg-[#095544] text-gray-600 hover:text-white rounded-lg transition"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="p-2 bg-gray-100 hover:bg-[#095544] text-gray-600 hover:text-white rounded-lg transition"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="p-2 bg-gray-100 hover:bg-[#095544] text-gray-600 hover:text-white rounded-lg transition"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
});

export default ContactInfo;
