// src/components/productDetail/RightSection.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Box, Smartphone, ChevronLeft, ChevronRight, X } from "lucide-react";
import defaultImage from "../../assets/default-image.jpg";
import ModelViewer from "./ModelViewer"; 

interface RightSectionProps {
  thumbnailImage: string;
  images: string[];
  images3d?: { modelUrl: string; previewImage?: string; format?: string }[];
  selectedColorImages?: string[];
}

const RightSection: React.FC<RightSectionProps> = ({
  thumbnailImage,
  images,
  images3d,
  selectedColorImages,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const [show3DModal, setShow3DModal] = useState(false); // ✅ trạng thái modal
  const [selectedModel, setSelectedModel] = useState<{
    modelUrl: string;
    format?: string;
  } | null>(null);

  // ✅ Gom tất cả ảnh hợp lệ (thumbnail + ảnh + preview 3D)
  const allImages = useMemo(() => {
    const arr: string[] = [];

    if (thumbnailImage && thumbnailImage.trim() !== "") arr.push(thumbnailImage);
    if (Array.isArray(images))
      arr.push(...images.filter((img) => !!img && img.trim() !== ""));
    if (Array.isArray(images3d))
      arr.push(
        ...images3d
          .map((i) => i?.previewImage)
          .filter((img): img is string => typeof img === "string" && img.trim() !== "" && img.startsWith("http"))
      );

    return arr.length > 0 ? Array.from(new Set(arr)) : [defaultImage];
  }, [thumbnailImage, images, images3d]);

  const initialImage =
    selectedColorImages && selectedColorImages.length > 0
      ? selectedColorImages[0]
      : allImages[0];

  const [mainImage, setMainImage] = useState<string>(initialImage || defaultImage);

  // ✅ Cập nhật ảnh chính khi đổi màu
  useEffect(() => {
    if (selectedColorImages && selectedColorImages.length > 0)
      setMainImage(selectedColorImages[0]);
    else if (allImages.length > 0) setMainImage(allImages[0]);
    else setMainImage(defaultImage);
  }, [allImages, selectedColorImages]);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  const scrollByAmount = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // ✅ Hàm mở modal hiển thị 3D
  const handleOpen3D = () => {
    console.log("Open 3D modal", images3d);
    
  if (!images3d || images3d.length === 0) {
    alert("Sản phẩm này chưa có mô hình 3D.");
    return;
  }

  // ✅ Chỉ nhận modelUrl thật sự hợp lệ (http, không trống)
  const firstActive = images3d.find(
    (m) =>
      typeof m.modelUrl === "string" &&
      m.modelUrl.trim() !== "" &&
      m.modelUrl.startsWith("http")
  );
    console.log(" 3 d  model", firstActive);


  if (firstActive) {
    setSelectedModel({
      modelUrl: firstActive.modelUrl,
      format: firstActive.format,
    });
    setShow3DModal(true);
  } else {
    alert("Không tìm thấy mô hình 3D hợp lệ.");
  }
};

  // ✅ Hàm đóng modal
  const handleClose3D = () => {
    setShow3DModal(false);
    setSelectedModel(null);
  };

  return (
    <div className="flex flex-col items-center relative w-full">
      {/* Ảnh chính */}
      <div className="mb-4 flex w-full justify-center bg-gray-50 p-4 border border-gray-200 rounded-lg">
        <img
          src={mainImage || defaultImage}
          alt="Hình sản phẩm"
          className="max-h-[500px] w-full object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = defaultImage;
          }}
        />
      </div>

      {/* Thumbnails + Nút 3D/AR */}
      <div className="relative w-full flex justify-center">
        {/* Mũi tên trái */}
        {showLeftArrow && (
          <button
            type="button"
            onClick={() => scrollByAmount(-200)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full shadow p-2"
            aria-label="Cuộn trái"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
        )}

        {/* Thanh danh sách ảnh */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 justify-start scroll-smooth max-w-full px-8"
          style={{
            scrollBehavior: "smooth",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>
            {`
              div::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>

          {allImages.map((img, index) => {
            const active = mainImage === img;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setMainImage(img || defaultImage)}
                className={`h-20 w-20 flex-shrink-0 overflow-hidden border rounded-md transition focus:outline-none ${
                  active
                    ? "border-emerald-600 shadow-md"
                    : "border-gray-300 hover:border-emerald-300"
                }`}
              >
                <img
                  src={img || defaultImage}
                  alt={`thumb-${index}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = defaultImage;
                  }}
                />
              </button>
            );
          })}

          {/* Nút 3D */}
          <button
            type="button"
            onClick={handleOpen3D}
            className="h-20 w-20 flex-shrink-0 flex flex-col items-center justify-center gap-1 border border-gray-300 rounded-md text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-400"
            title="Xem 3D"
          >
            <Box className="h-6 w-6" />
            <span className="text-xs font-medium">3D</span>
          </button>

          {/* Nút AR (chưa kích hoạt) */}
          <button
            type="button"
            className="h-20 w-20 flex-shrink-0 flex flex-col items-center justify-center gap-1 border border-gray-300 rounded-md text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-400"
            title="Xem AR"
          >
            <Smartphone className="h-6 w-6" />
            <span className="text-xs font-medium">AR</span>
          </button>
        </div>

        {/* Mũi tên phải */}
        {showRightArrow && (
          <button
            type="button"
            onClick={() => scrollByAmount(200)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full shadow p-2"
            aria-label="Cuộn phải"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        )}
      </div>

      {/* ✅ Modal hiển thị mô hình 3D */}
      {show3DModal && selectedModel?.modelUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl relative shadow-lg overflow-hidden">
            {/* Nút đóng */}
            <button
              onClick={handleClose3D}
              className="absolute top-3 right-3 text-gray-700 hover:text-red-500 transition"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Vùng hiển thị mô hình */}
            <div className="w-full h-[500px]">
              <ModelViewer
                modelUrl={selectedModel.modelUrl}
                format={selectedModel.format}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSection;
