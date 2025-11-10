import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./setupLeaflet";
import { ThemeProvider } from "./context/ThemeContext";
import { handleStaleToken } from "./utils/corsHandler";

// Check và clear stale token khi app khởi động
handleStaleToken();

const el = document.getElementById("root");
if (!el) throw new Error("Root element #root not found");

createRoot(el).render(
  <BrowserRouter>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </BrowserRouter>
);
