import React, { useState } from "react";
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
  const allImages: string[] = [];

  if (thumbnailImage) allImages.push(thumbnailImage);
  if (images && images.length > 0) allImages.push(...images);
  if (images3d && images3d.length > 0)
    allImages.push(...images3d.map((i) => i.previewImage).filter(Boolean));
  if (allImages.length === 0) allImages.push(defaultImage);

  // Nếu có màu được chọn -> ảnh chính = ảnh đầu tiên của màu đó
  const initialImage =
    selectedColorImages && selectedColorImages.length > 0
      ? selectedColorImages[0]
      : allImages[0];

  const [mainImage, setMainImage] = useState(initialImage || defaultImage);

  // Khi đổi màu thì mainImage thay đổi theo
  React.useEffect(() => {
    if (selectedColorImages && selectedColorImages.length > 0) {
      setMainImage(selectedColorImages[0]);
    }
  }, [selectedColorImages]);

  return (
    <div className="bg-white flex flex-col items-center">
      {/* Ảnh chính */}
      <div className="w-full flex justify-center mb-4">
        <img
          src={mainImage || defaultImage}
          alt="Product"
          className="max-h-[400px] object-contain"
        />
      </div>

      {/* Danh sách ảnh nhỏ */}
      <div className="flex space-x-3">
        {allImages.map((img, index) => (
          <button
            key={index}
            onClick={() => setMainImage(img || defaultImage)}
            className={`w-20 h-20 border rounded overflow-hidden ${
              mainImage === img ? "border-green-600" : "border-gray-300"
            }`}
          >
            <img
              src={img || defaultImage}
              alt={`thumb-${index}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};


export default RightSection;
