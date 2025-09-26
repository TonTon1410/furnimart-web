import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppRouter from "@/router/AppRouter";
import ScrollToTop from "@/components/ScrollToTop";

export default function App() {
  const location = useLocation();

  const hideLayoutRoutes = ["/login", "/register", "/forgot-password", "/dashboard"];
  const hideLayout = hideLayoutRoutes.some((r) => location.pathname.startsWith(r));

  // Chỉ Home mới cần chồng dưới Navbar để hưởng hiệu ứng trong suốt
  const overlapNavbarRoutes = ["/"]; 
  const overlapNavbar = overlapNavbarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {!hideLayout && <Navbar />}
      <ScrollToTop>
        {/* Nếu KHÔNG overlap thì đẩy xuống bằng chiều cao navbar */}
        <div className={overlapNavbar ? "" : "pt-20"}>
          <AppRouter />
        </div>
      </ScrollToTop>
      {!hideLayout && <Footer />}
    </div>
  );
}
