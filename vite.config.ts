import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  define: {
    global: "window",
  },
  plugins: [react(), tailwindcss()],
  css: {
    postcss: {},
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "react-vendor": ["react", "react-dom", "react-router-dom"],

          // UI libraries
          "ui-vendor": [
            "lucide-react",
            "@radix-ui/react-toast",
            "@radix-ui/react-dialog",
          ],

          // Maps (heavy library)
          "leaflet-vendor": ["leaflet", "react-leaflet"],

          // 3D models
          "three-vendor": [
            "three",
            "@react-three/fiber",
            "@react-three/drei",
            "three-stdlib",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase to 1000kb
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["furnimart.click", "localhost", "127.0.0.1"],
  },
});
