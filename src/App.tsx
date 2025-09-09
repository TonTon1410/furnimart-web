import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppRouter from "@/router/AppRouter";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <AppRouter />
      <Footer />
    </div>
  );
}
