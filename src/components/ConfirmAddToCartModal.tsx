// src/components/productDetail/ConfirmAddToCartModal.tsx
import React, { useEffect, useMemo, useState } from "react";

export type Color = {
  id: string; // đây chính là productColorId trong API mới
  colorName: string;
  hexCode: string;
  images?: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  // Hỗ trợ async để hiển thị loading đúng
  onConfirm: (opts: {
    quantity: number;
    productColorId: string | null;
  }) => void | Promise<void>;
  productName: string;
  price: number;
  colors: Color[];
  initialColorId: string | null;
  initialQty?: number;
};

const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

const ConfirmAddToCartModal: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  productName,
  price,
  colors,
  initialColorId,
  initialQty = 1,
}) => {
  const [qty, setQty] = useState(Math.max(1, initialQty));
  const [productColorId, setProductColorId] = useState<string | null>(
    initialColorId
  );
  const [submitting, setSubmitting] = useState(false);

  // Khoá scroll khi mở modal
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC để đóng (trừ khi đang submitting)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!submitting && e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  // Reset state khi mở modal với sản phẩm mới
  useEffect(() => {
    if (!open) return;
    // Reset về màu được chọn từ props hoặc màu đầu tiên
    setProductColorId(
      initialColorId || (colors.length > 0 ? colors[0].id : null)
    );
    setQty(Math.max(1, initialQty));
  }, [open, colors, initialColorId, initialQty]);

  const color = useMemo(
    () => colors.find((c) => c.id === productColorId) || null,
    [colors, productColorId]
  );
  const thumbs = color?.images ?? [];
  const [mainImg, setMainImg] = useState<string | null>(null);

  // Cập nhật hình ảnh chính khi thumbs hoặc productColorId thay đổi
  useEffect(() => {
    setMainImg(thumbs[0] || null);
  }, [thumbs, productColorId]);

  if (!open) return null;

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (submitting) return;
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirm = async () => {
    if (!productColorId) return;
    try {
      setSubmitting(true);
      await onConfirm({ quantity: qty, productColorId }); // ✅ gọi theo API mới
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 px-3"
      role="dialog"
      aria-modal="true"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-2xl">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900">
            Xác nhận thêm vào giỏ
          </h3>
          <p className="text-sm text-gray-600">
            {productName} •{" "}
            <span className="font-semibold text-amber-600">
              {fmtVND(price)}
            </span>
          </p>
        </div>

        {/* Nội dung */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* Khung ảnh */}
          <div>
            <div className="mb-2 flex h-48 w-full items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50">
              {mainImg ? (
                <img
                  src={mainImg}
                  alt="preview"
                  className="h-full w-full object-contain"
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.visibility =
                      "hidden")
                  }
                />
              ) : (
                <div className="text-xs text-gray-400">Không có ảnh</div>
              )}
            </div>
            {thumbs.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {thumbs.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMainImg(img)}
                    disabled={submitting}
                    className={`h-12 w-12 shrink-0 overflow-hidden rounded border transition ${
                      mainImg === img
                        ? "border-emerald-600"
                        : "border-gray-300 hover:border-emerald-300"
                    } ${submitting ? "opacity-60" : ""}`}
                    aria-label={`thumb-${i + 1}`}
                  >
                    <img
                      src={img}
                      alt={`thumb-${i}`}
                      className="h-full w-full object-cover"
                      onError={(e) =>
                        ((
                          e.currentTarget as HTMLImageElement
                        ).style.visibility = "hidden")
                      }
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Điều khiển */}
          <div className="space-y-3">
            {/* Chọn màu */}
            {colors.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-medium text-gray-700">
                  Màu sắc
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const active = productColorId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setProductColorId(c.id)}
                        disabled={submitting}
                        title={c.colorName}
                        aria-label={`Chọn ${c.colorName}`}
                        className={`h-8 min-w-8 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          active
                            ? "border-emerald-600"
                            : "border-gray-300 hover:border-emerald-300"
                        } ${submitting ? "opacity-60" : ""}`}
                        style={{ backgroundColor: c.hexCode }}
                      />
                    );
                  })}
                </div>
                {color && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs">
                    <span
                      className="inline-block h-3 w-3 rounded-full border"
                      style={{ backgroundColor: color.hexCode }}
                    />
                    <span className="font-medium text-gray-800">
                      {color.colorName}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Số lượng */}
            <div>
              <div className="mb-2 text-xs font-medium text-gray-700">
                Số lượng
              </div>
              <div className="inline-flex items-center overflow-hidden rounded-md border">
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={submitting}
                >
                  −
                </button>
                <span className="min-w-10 px-3 text-center text-sm font-semibold text-gray-900">
                  {qty}
                </span>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                  onClick={() => setQty((q) => q + 1)}
                  disabled={submitting}
                >
                  +
                </button>
              </div>
            </div>

            {/* Tạm tính */}
            <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="text-xs text-gray-600">Tạm tính</span>
              <span className="text-base font-semibold text-amber-600">
                {fmtVND(price * qty)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!productColorId || submitting}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                {submitting ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAddToCartModal;
