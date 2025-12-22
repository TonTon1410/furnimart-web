import React, { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import ratingService, { type RatingResponseData } from "@/service/ratingService";

interface RatingSectionProps {
  productId: string;
}

const RatingSection: React.FC<RatingSectionProps> = ({ productId }) => {
  const [average, setAverage] = useState<number>(0);
  const [reviews, setReviews] = useState<RatingResponseData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!productId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Gọi song song 2 API để tối ưu tốc độ
        const [avgRes, listRes] = await Promise.all([
          ratingService.getAverageRating(productId),
          ratingService.getRatingsByProduct(productId),
        ]);

        if (avgRes && avgRes.data) {
          setAverage(avgRes.data);
        }

        if (listRes && Array.isArray(listRes.data)) {
          // Sắp xếp review mới nhất lên đầu
          const sortedReviews = listRes.data.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setReviews(sortedReviews);
        }
      } catch (error) {
        console.error("Failed to load ratings", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  // Helper render sao
  const renderStars = (score: number, size: string = "w-4 h-4") => {
    return (
      <div className="flex text-yellow-400 gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= Math.round(score) ? "fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // Helper format ngày
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Phần tổng quan đánh giá */}
      <div className="bg-gray-50 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-12 border border-gray-100">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {average.toFixed(1)}
            <span className="text-2xl text-gray-400 font-normal">/5</span>
          </div>
          <div className="flex justify-center mb-2">
            {renderStars(average, "w-6 h-6")}
          </div>
          <p className="text-gray-500 text-sm">
            Dựa trên {reviews.length} đánh giá
          </p>
        </div>

        {/* Thanh phân bố sao (Giả lập visual) */}
        <div className="flex-1 w-full max-w-md space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter(
              (r) => Math.round(r.score) === star
            ).length;
            const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="font-medium text-gray-600 w-3">{star}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className="text-gray-400 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danh sách bình luận */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
          Đánh giá chi tiết ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Chưa có đánh giá nào cho sản phẩm này.
          </p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex gap-4 p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition hover:shadow-md"
              >
                {/* Avatar giả lập */}
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <User className="w-5 h-5" />
                  </div>
                </div>

                {/* Nội dung */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Khách hàng {/* Vì API không trả về tên user, để mặc định */}
                      </h4>
                      <div className="mt-1">{renderStars(review.score)}</div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingSection;