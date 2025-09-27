import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  if (!order) return <p>Không có thông tin đơn hàng.</p>;

  return (
    <div className="order-confirmation">
      <h2>Đặt hàng thành công!</h2>
      <p>Cảm ơn bạn đã mua hàng.</p>
      <p>Mã đơn hàng: <strong>{order.id}</strong></p>
      <button onClick={() => navigate("/orders")}>Theo dõi đơn hàng</button>
    </div>
  );
};

export default OrderConfirmationPage;

