import React from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
}

const BottomSection: React.FC<{ related: Product[] }> = ({ related }) => {
  return (
    <div className="bg-white mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Bạn có thể thích</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {related.map((item) => (
          <div key={item.id} className="text-center">
            <img
              src={item.images[0]}
              alt={item.name}
              className="w-40 h-40 mx-auto object-contain mb-2"
            />
            <p>{item.name}</p>
            <p className="font-semibold">${item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BottomSection;
