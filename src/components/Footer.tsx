import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = React.memo(() => {
  return (
    <footer className="bg-[#095544] text-gray-200 pt-16 pb-8 mt-20">
      <div className="mx-auto max-w-7xl px-6 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cột 1 */}
        <div>
          <h3 className="text-lg font-bold text-white">
            Furni<span className="text-yellow-400">.</span>
          </h3>
          <p className="mt-3 text-sm leading-relaxed">
            Nội thất hiện đại và tối giản, mang lại không gian sống tinh tế cho
            gia đình bạn.
          </p>
        </div>

        {/* Cột 2 */}
        <div>
          <h4 className="font-semibold text-white mb-3">Liên kết nhanh</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:text-yellow-400">
                Trang chủ
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-yellow-400">
                Sản phẩm
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-yellow-400">
                Giới thiệu
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-yellow-400">
                Liên hệ
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 3 */}
        <div>
          <h4 className="font-semibold text-white mb-3">Hỗ trợ</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-yellow-400">
                Câu hỏi thường gặp
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400">
                Chính sách đổi trả
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400">
                Chính sách bảo mật
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400">
                Điều khoản dịch vụ
              </a>
            </li>
          </ul>
        </div>

        {/* Cột 4 */}
        <div>
          <h4 className="font-semibold text-white mb-3">Kết nối</h4>
          <div className="flex gap-4">
            <a href="#" className="hover:text-yellow-400" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-yellow-400" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-yellow-400" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
          <p className="mt-4 text-sm">Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</p>
          <p className="text-sm">Điện thoại: 0123 456 789</p>
        </div>
      </div>

      <div className="mt-12 border-t border-gray-600 pt-6 text-center text-sm text-gray-400">
        © 2025 Furni. Tất cả quyền được bảo lưu.
      </div>
    </footer>
  );
});

export default Footer;
