import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./setupLeaflet";
import { ThemeProvider } from "./context/ThemeContext";
import { handleStaleToken } from "./utils/corsHandler";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Google OAuth Client ID
const GOOGLE_CLIENT_ID =
  "274860327369-kta4kv3ld1qlff5trusfft5elq0vgbsk.apps.googleusercontent.com";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Check và clear stale token khi app khởi động
handleStaleToken();

const el = document.getElementById("root");
if (!el) throw new Error("Root element #root not found");

const queryClient = new QueryClient({
  defaultOptions: { // Tùy chọn, thiết lập cấu hình mặc định
    queries: {
      refetchOnWindowFocus: false, 
      retry: 1, 
    },
  },
});

createRoot(el).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);
