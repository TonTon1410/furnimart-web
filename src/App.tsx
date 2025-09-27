import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppRouter from "@/router/AppRouter";
import ScrollToTop from "@/components/ScrollToTop";

export default function App() {
  const location = useLocation();

  const hideLayoutRoutes = ["/login", "/register", "/forgot-password", "/dashboard"];
  const hideLayout = hideLayoutRoutes.some((r) => location.pathname.startsWith(r));

  const overlapNavbar = location.pathname === "/" && !hideLayout;
  const shouldPadTop = !hideLayout && !overlapNavbar;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {!hideLayout && <Navbar />}
      <ScrollToTop>
        <div className={shouldPadTop ? "pt-20" : ""}>
          <AppRouter />
        </div>
      </ScrollToTop>
      {!hideLayout && <Footer />}
    </div>
  );
}
