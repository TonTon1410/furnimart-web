import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./setupLeaflet";
import { ThemeProvider } from "./context/ThemeContext";
import { handleStaleToken } from "./utils/authCacheUtils";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from "./components/ErrorBoundary";

// Google OAuth Client ID
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

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
  <ErrorBoundary>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </ErrorBoundary>
);
