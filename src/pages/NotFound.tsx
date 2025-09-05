import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50">
      <h1 className="text-6xl font-bold text-blue-600">404</h1>
      <p className="mt-4 text-gray-600">Page not found</p>
      <Link
        to="/"
        className="mt-6 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
      >
        Go Home
      </Link>
    </div>
  );
}
