import React, { useMemo, useState, useEffect } from "react";
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
  const allImages = useMemo(() => {
    const arr: string[] = [];
    if (thumbnailImage) arr.push(thumbnailImage);
    if (Array.isArray(images) && images.length > 0) arr.push(...images);
    if (Array.isArray(images3d) && images3d.length > 0) {
      arr.push(...images3d.map((i) => i.previewImage).filter(Boolean));
    }
    return arr.length > 0 ? arr : [defaultImage];
  }, [thumbnailImage, images, images3d]);

  // Ảnh ưu tiên theo màu chọn (nếu có)
  const initialImage =
    selectedColorImages && selectedColorImages.length > 0
      ? selectedColorImages[0]
      : allImages[0];

  const [mainImage, setMainImage] = useState<string>(initialImage || defaultImage);

  // Khi đổi màu → đổi ảnh chính
  useEffect(() => {
    if (selectedColorImages && selectedColorImages.length > 0) {
      setMainImage(selectedColorImages[0]);
    }
  }, [selectedColorImages]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Ảnh chính */}
      <div className="mb-4 flex w-full justify-center rounded-xl bg-gray-50 p-3">
        <img
          src={mainImage || defaultImage}
          alt="Hình sản phẩm"
          className="max-h-[420px] w-full max-w-full object-contain"
          onError={(e) => ((e.currentTarget.src = defaultImage))}
        />
      </div>

      {/* Thumbs */}
      <div className="flex flex-wrap gap-3">
        {allImages.map((img, index) => {
          const active = mainImage === img;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setMainImage(img || defaultImage)}
              className={`h-20 w-20 overflow-hidden rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                active ? "border-emerald-600 shadow-sm" : "border-gray-300 hover:border-emerald-300"
              }`}
              aria-label={`Ảnh ${index + 1}`}
            >
              <img
                src={img || defaultImage}
                alt={`thumb-${index}`}
                className="h-full w-full object-cover"
                onError={(e) => ((e.currentTarget.src = defaultImage))}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RightSection;
