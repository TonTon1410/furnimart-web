import React from "react";
import { useNavigate } from "react-router-dom";
import orderConfirmGif from "@/assets/order-confirm-gif-maker.gif";

const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 text-center">
      <img
        src={orderConfirmGif}
        alt="Order confirmed"
        className="w-84 h-64 mb-0" 
      />
      
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Đặt hàng thành công
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-xl">
        Cảm ơn bạn đã đặt hàng tại Furni Mart! Đơn hàng của bạn đang được xử lý, hãy theo dõi trạng thái đơn hàng để biết thêm chi tiết.
      </p>

      <button
        onClick={() => navigate("/orders")}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
      >
        Theo dõi đơn hàng
      </button>
    </div>
  );
};

export default OrderConfirmationPage;