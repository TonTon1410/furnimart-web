/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, MessageSquare, Send } from "lucide-react";
import ratingService from "@/service/ratingService";
import { userService } from "@/service/userService"; // Import userService tương tự CheckoutPage
import { useToast } from "@/context/ToastContext";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  orderId: string;
  onSuccess: () => void;
}

export const RatingModal = ({
  isOpen,
  onClose,
  productId,
  orderId,
  onSuccess,
}: RatingModalProps) => {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!comment.trim()) {
      showToast({
        type: "warning",
        title: "Thông báo",
        description: "Vui lòng nhập nội dung đánh giá",
      });
      return;
    }

    setLoading(true);
    try {
      // THAY ĐỔI: Lấy Profile từ userService giống CheckoutPage để lấy ID chuẩn
      const userProfileRes = await userService.getProfile();
      const userId = userProfileRes.data?.id; 

      if (!userId) {
        showToast({
          type: "error",
          title: "Lỗi xác thực",
          description: "Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại.",
        });
        return;
      }

      await ratingService.createRating(orderId, {
        userId, 
        productId,
        score,
        comment,
      });

      showToast({
        type: "success",
        title: "Thành công",
        description: "Cảm ơn bạn đã gửi đánh giá sản phẩm!",
      });

      onSuccess();
      onClose();
      setComment("");
      setScore(5);
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Gửi đánh giá thất bại",
        description: error.response?.data?.message || error.message || "Gửi đánh giá thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                Đánh giá sản phẩm
              </h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <div className="p-6">
              {/* Stars */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setScore(star)}
                    className="active:scale-90 transition transform"
                    type="button"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= score
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Comment */}
              <div className="space-y-2 mb-6">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Nhận xét của bạn
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Sản phẩm rất tốt, tôi rất hài lòng..."
                  className="w-full min-h-[120px] p-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border font-medium hover:bg-muted text-foreground transition-colors"
                >
                  Để sau
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Gửi đánh giá
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};