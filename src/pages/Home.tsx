export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800">
        Welcome to <span className="text-blue-600">FurniMart</span>
      </h1>
      <p className="mt-4 text-gray-600 max-w-md text-center">
        Multi-branch Furniture E-commerce with 3D Visualization.  
        Shop smarter, live better ✨
      </p>
      <button className="mt-6 px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg shadow hover:bg-amber-600 transition">
        Start Shopping
      </button>
    </div>
  );
}
