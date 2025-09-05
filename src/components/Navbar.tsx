import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-6 py-3 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-wide">
          FurniMart
        </Link>
        <div className="flex gap-4">
          <Link to="/" className="hover:text-amber-300">Home</Link>
          <Link to="/login" className="hover:text-amber-300">Login</Link>
        </div>
      </div>
    </nav>
  );
}
