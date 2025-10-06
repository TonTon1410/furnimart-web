import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EnumProcessOrder, paymentService } from "../service/paymentService";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const status = params.get("status");
  const orderId = params.get("orderId");

  const isSuccess = status === "success";
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    if (isSuccess && orderId) {
      paymentService
        .updateStatus(Number(orderId), EnumProcessOrder.PAYMENT)
        .then(() => console.log(`Order ${orderId} updated to PAYMENT`))
        .catch((err) => console.error("Error updating order status:", err));
    }
  }, [isSuccess, orderId]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-white px-4">
      <div
        className={`relative bg-white bg-opacity-90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center transform transition-all duration-1000 ${
          animate ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-10"
        } border border-amber-200/50`}
      >
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-10 rounded-3xl"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/wood-pattern.png')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10">
          {isSuccess ? (
            <>
              <div className="flex justify-center mb-6">
                <CheckCircleIcon className="h-24 w-24 text-green-500 animate-bounce" />
              </div>
              <h2 className="text-4xl font-extrabold text-amber-800 mb-4 font-serif tracking-tight">
                Thanh toán thành công
              </h2>
              <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                Đơn hàng{" "}
                <span className="font-semibold text-amber-700">#{orderId}</span>{" "}
                đã được thanh toán thành công! Hãy tận hưởng không gian nội thất sang trọng của bạn với FurniMart.
              </p>
              <button
                onClick={() => navigate("/orders")}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium py-3 px-10 rounded-full shadow-lg transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                Xem đơn hàng
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <XCircleIcon className="h-24 w-24 text-rose-600 animate-pulse" />
              </div>
              <h2 className="text-4xl font-extrabold text-rose-700 mb-4 font-serif tracking-tight">
                Thanh toán thất bại
              </h2>
              <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                Thanh toán không thành công. Vui lòng thử lại hoặc liên hệ chúng tôi để được hỗ trợ.
              </p>
              <button
                onClick={() => navigate("/checkout")}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-medium py-3 px-10 rounded-full shadow-lg transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                Quay lại thanh toán
              </button>
            </>
          )}

          <p className="mt-10 text-gray-500 text-sm font-light">
            Cảm ơn bạn đã tin tưởng{" "}
            <span className="font-semibold text-amber-700 italic">FurniMart</span>{" "}
            cho không gian sống của bạn.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
