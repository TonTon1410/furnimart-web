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
  // Tập hợp tất cả ảnh khả dụng (thumbnail, images, 3D previews)
  const allImages = useMemo(() => {
    const arr: string[] = [];
    if (thumbnailImage) arr.push(thumbnailImage);
    if (Array.isArray(images) && images.length > 0) arr.push(...images);
    if (Array.isArray(images3d) && images3d.length > 0) {
      arr.push(...images3d.map((i) => i.previewImage).filter(Boolean));
    }
    return arr.length > 0 ? arr : [defaultImage];
  }, [thumbnailImage, images, images3d]);

  // Giá trị khởi tạo (nếu có ảnh theo màu thì ưu tiên, else ảnh đầu tiên)
  const initialImage =
    selectedColorImages && selectedColorImages.length > 0
      ? selectedColorImages[0]
      : allImages[0];

  const [mainImage, setMainImage] = useState<string>(
    initialImage || defaultImage
  );

  // Khi props ảnh thay đổi (ví dụ: điều hướng sang product khác),
  // đồng bộ mainImage: ưu tiên ảnh theo màu, nếu không dùng allImages[0].
  useEffect(() => {
    if (selectedColorImages && selectedColorImages.length > 0) {
      setMainImage(selectedColorImages[0]);
      return;
    }
    if (allImages && allImages.length > 0) {
      setMainImage(allImages[0]);
    } else {
      setMainImage(defaultImage);
    }
  }, [allImages, selectedColorImages]);

  return (
    <div>
      {/* Ảnh chính */}
      <div className="mb-4 flex w-full justify-center bg-gray-50 p-4 border border-gray-200">
        <img
          src={mainImage || defaultImage}
          alt="Hình sản phẩm"
          className="max-h-[500px] w-full object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = defaultImage;
          }}
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
              className={`h-20 w-20 overflow-hidden border transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                active
                  ? "border-emerald-600 shadow-sm"
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
    </div>
  );
};

export default RightSection;
