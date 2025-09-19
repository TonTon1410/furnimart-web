import React, { useState } from "react";

interface RightSectionProps {
  thumbnailImage: string;
  images: string[];
  images3d?: { previewImage: string }[];
}

const RightSection: React.FC<RightSectionProps> = ({ thumbnailImage, images, images3d }) => {
  // Ảnh chính đang hiển thị
  const allImages = [
    thumbnailImage,
    ...images,
    ...(images3d?.map((i) => i.previewImage) || []),
  ].filter(Boolean);

  const [mainImage, setMainImage] = useState(allImages[0]);

  return (
    <div className="bg-white flex flex-col items-center">
      {/* Ảnh chính */}
      <div className="w-full flex justify-center mb-4">
        <img
          src={mainImage}
          alt="Product"
          className="max-h-[400px] object-contain"
        />
      </div>

      {/* Danh sách ảnh nhỏ */}
      <div className="flex space-x-3">
        {allImages.map((img, index) => (
          <button
            key={index}
            onClick={() => setMainImage(img)}
            className={`w-20 h-20 border rounded overflow-hidden ${
              mainImage === img ? "border-green-600" : "border-gray-300"
            }`}
          >
            <img
              src={img}
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
