import React from "react";
import { useCartStore } from "@/store/cart";

const Cart: React.FC = () => {
  const { items, remove, clear, total } = useCartStore();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold">Your Cart</h1>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">Giỏ hàng trống.</p>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-gray-100">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <img
                  src={i.image}
                  alt={i.title || "Cart item"}
                  className="h-16 w-16 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <p className="font-medium">{i.title}</p>
                  <p className="text-sm text-gray-500">
                    ${i.price.toFixed(2)} × {i.qty}
                  </p>
                </div>
                <button
                  onClick={() => remove(i.id)}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-lg font-semibold">Total: ${total.toFixed(2)}</p>
            <div className="flex gap-3">
              <button
                onClick={clear}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Clear
              </button>
              <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
