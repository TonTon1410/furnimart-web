import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    postcss: {},
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true, // cho phép truy cập từ ngoài
    port: 5173, // bạn đang map ra 8000 ở docker-compose
    allowedHosts: [
      "furnimart.click", // 👈 thêm domain của bạn
      "localhost",
      "127.0.0.1"
    ]
  }
});
