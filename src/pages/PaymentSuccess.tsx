/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/PaymentSuccess.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentService } from "@/service/paymentService";
import LoadingPage from "./LoadingPage";
import { useToastRadix } from "@/context/useToastRadix";

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToastRadix();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        // lấy query string từ URL (VD: ?vnp_Amount=...&vnp_ResponseCode=00)
        const query = location.search;
        const res = await paymentService.vnpayReturn(query);
        setResult(res.data);
        if (res.data?.status === "SUCCESS") {
          showToast({
            type: "success",
            title: "Thanh toán thành công!",
            description: "Đơn hàng của bạn đã được xác nhận.",
          });
        } else {
          showToast({
            type: "error",
            title: "Thanh toán thất bại",
            description: res.data?.message || "Vui lòng thử lại.",
          });
        }
      } catch (err: any) {
        console.error("Lỗi gọi vnpayReturn:", err);
        showToast({
          type: "error",
          title: "Lỗi hệ thống",
          description: err.response?.data?.message || err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [location.search]);

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 text-center">
      {result?.status === "SUCCESS" ? (
        <>
          <h2 className="text-2xl font-bold text-emerald-600 mb-4">
            Thanh toán thành công
          </h2>
          <p className="text-gray-700 mb-6">
            Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý.
          </p>
          <button
            onClick={() => navigate("/orders")}
            className="rounded-lg bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700"
          >
            Xem đơn hàng
          </button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Thanh toán thất bại
          </h2>
          <p className="text-gray-700 mb-6">
            {result?.message || "Vui lòng thử lại sau."}
          </p>
          <button
            onClick={() => navigate("/checkout")}
            className="rounded-lg bg-gray-600 px-6 py-2 text-white hover:bg-gray-700"
          >
            Quay lại thanh toán
          </button>
        </>
      )}

      <ToastComponent />
    </div>
  );
};

export default PaymentSuccess;
