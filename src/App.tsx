import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppRouter from "@/router/AppRouter";

export default function App() {
  const location = useLocation();

  // Các route cần ẩn Navbar/Footer
  const hideLayoutRoutes = ["/login", "/register", "/forgot-password"];
  const hideLayout = hideLayoutRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {!hideLayout && <Navbar />}
      <AppRouter />
      {!hideLayout && <Footer />}
    </div>
  );
}
