// src/components/productDetail/RightSection.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Box, Smartphone } from "lucide-react";
import defaultImage from "../../assets/default-image.jpg";

interface RightSectionProps {
  thumbnailImage: string;
  images: string[];
  images3d?: { previewImage: string }[];
  selectedColorImages?: string[];
}

const RightSection: React.FC<RightSectionProps> = ({
  thumbnailImage,
  images,
  images3d,
  selectedColorImages,
}) => {
  // Gom tất cả ảnh hợp lệ
  const allImages = useMemo(() => {
    const arr: string[] = [];

    if (thumbnailImage && thumbnailImage.trim() !== "") {
      arr.push(thumbnailImage);
    }

    if (Array.isArray(images)) {
      arr.push(...images.filter((img) => !!img && img.trim() !== ""));
    }

    if (Array.isArray(images3d)) {
      arr.push(
        ...images3d
          .map((i) => i?.previewImage)
          .filter((img) => !!img && img.trim() !== "" && img.startsWith("http"))
      );
    }

    return arr.length > 0 ? Array.from(new Set(arr)) : [defaultImage];
  }, [thumbnailImage, images, images3d]);

  // Ảnh chính
  const initialImage =
    selectedColorImages && selectedColorImages.length > 0
      ? selectedColorImages[0]
      : allImages[0];

  const [mainImage, setMainImage] = useState<string>(initialImage || defaultImage);

  useEffect(() => {
    if (selectedColorImages && selectedColorImages.length > 0) {
      setMainImage(selectedColorImages[0]);
    } else if (allImages.length > 0) {
      setMainImage(allImages[0]);
    } else {
      setMainImage(defaultImage);
    }
  }, [allImages, selectedColorImages]);

  return (
    <div className="flex flex-col items-center">
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
      <div className="flex w-full items-center justify-between gap-4">
        {/* Thumbnails: scroll ngang ở mobile */}
        <div className="flex gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
          {allImages.map((img, index) => {
            const active = mainImage === img;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setMainImage(img || defaultImage)}
                className={`h-20 w-20 flex-shrink-0 overflow-hidden border rounded-md transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  active
                    ? "border-emerald-600 shadow-md"
                    : "border-gray-300 hover:border-emerald-300"
                }`}
                aria-label={`Ảnh ${index + 1}`}
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
        </div>

        {/* Nút 3D & AR */}
        <div className="flex gap-3 flex-shrink-0">
          <button
            type="button"
            className="flex flex-col items-center gap-1 rounded-full border border-gray-300 p-3 text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-400"
            title="Xem 3D"
          >
            <Box className="h-6 w-6" />
            <span className="text-xs font-medium">3D</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 rounded-full border border-gray-300 p-3 text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-400"
            title="Xem AR"
          >
            <Smartphone className="h-6 w-6" />
            <span className="text-xs font-medium">AR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightSection;
