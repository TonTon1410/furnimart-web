import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppRouter from "@/router/AppRouter";
import ScrollToTop from "@/components/ScrollToTop";

export default function App() {
  const location = useLocation();

  const hideLayoutRoutes = ["/login", "/register", "/forgot-password", "/dashboard"];
  const hideLayout = hideLayoutRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {!hideLayout && <Navbar />}
      <ScrollToTop>
        <AppRouter />
      </ScrollToTop>
      {!hideLayout && <Footer />}
    </div>
  );
}
